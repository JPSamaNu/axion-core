import * as fc from 'fast-check';
import { UserStatus } from '@axion/types';
import { User } from '@domain/entities';
import { TypeOrmUserRepository } from '../typeorm-user.repository';
import { UserOrmEntity } from '../../entities/user.entity';
import { UserMapper } from '../../mappers/user.mapper';

/**
 * Propiedad 2: Aislamiento de datos por tenant en repositorios
 * Valida: Requisitos 2.4, 2.5
 *
 * Para cualquier consulta ejecutada a través de un repositorio con un tenant_id
 * de contexto activo, todos los resultados devueltos deben tener un tenant_id
 * que coincida exactamente con el tenant_id del contexto.
 */

// Arbitrary para generar UUIDs válidos
const uuidArb = fc.uuid();

// Arbitrary para generar UserOrmEntity
const userOrmArb = (tenantId: string) =>
  fc.record({
    id: uuidArb,
    email: fc.emailAddress(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
  }).map((data) => {
    const orm = new UserOrmEntity();
    orm.id = data.id;
    orm.tenantId = tenantId;
    orm.email = data.email;
    orm.passwordHash = '$2b$10$fakehash';
    orm.firstName = data.firstName;
    orm.lastName = data.lastName;
    orm.status = UserStatus.ACTIVE;
    orm.createdAt = new Date();
    orm.updatedAt = new Date();
    orm.deletedAt = null;
    orm.createdBy = 'system';
    orm.updatedBy = 'system';
    orm.userRoles = [];
    orm.refreshTokens = [];
    return orm;
  });

describe('Property 2: Aislamiento de datos por tenant en repositorios', () => {
  let repository: TypeOrmUserRepository;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    repository = new (TypeOrmUserRepository as any)(mockRepo);
  });

  it('findById should only return user if tenantId matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        uuidArb,
        async (userId, requestedTenantId, actualTenantId) => {
          const orm = new UserOrmEntity();
          orm.id = userId;
          orm.tenantId = actualTenantId;
          orm.email = 'test@test.com';
          orm.passwordHash = '$2b$10$hash';
          orm.firstName = 'Test';
          orm.lastName = 'User';
          orm.status = UserStatus.ACTIVE;
          orm.createdAt = new Date();
          orm.updatedAt = new Date();
          orm.deletedAt = null;
          orm.createdBy = 'system';
          orm.updatedBy = 'system';
          orm.userRoles = [];
          orm.refreshTokens = [];

          // TypeORM findOne filters by where clause including tenantId
          // So if tenantIds don't match, findOne returns null
          mockRepo.findOne.mockImplementation(async (opts: any) => {
            const where = opts.where;
            if (where.id === userId && where.tenantId === requestedTenantId) {
              // Only return if the actual entity matches the requested tenant
              return actualTenantId === requestedTenantId ? orm : null;
            }
            return null;
          });

          const result = await repository.findById(userId, requestedTenantId);

          if (result !== null) {
            // If we got a result, its tenantId MUST match the requested tenantId
            expect(result.tenantId).toBe(requestedTenantId);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('findAll should only return users belonging to the requested tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (tenantA, tenantB, countA, countB) => {
          fc.pre(tenantA !== tenantB);

          // Generate users for both tenants
          const usersA: UserOrmEntity[] = [];
          const usersB: UserOrmEntity[] = [];

          for (let i = 0; i < countA; i++) {
            const orm = new UserOrmEntity();
            orm.id = `a-${i}`;
            orm.tenantId = tenantA;
            orm.email = `a${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'A';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = null;
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            usersA.push(orm);
          }

          for (let i = 0; i < countB; i++) {
            const orm = new UserOrmEntity();
            orm.id = `b-${i}`;
            orm.tenantId = tenantB;
            orm.email = `b${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'B';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = null;
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            usersB.push(orm);
          }

          const allUsers = [...usersA, ...usersB];

          // Mock createQueryBuilder to simulate tenant filtering
          const mockQb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
          };

          mockQb.getMany.mockImplementation(async () => {
            // The where clause filters by tenantId
            const whereCall = mockQb.where.mock.calls[0];
            const tenantIdParam = whereCall[1]?.tenantId;
            return allUsers.filter((u) => u.tenantId === tenantIdParam);
          });

          mockRepo.createQueryBuilder.mockReturnValue(mockQb);

          const results = await repository.findAll(tenantA);

          // ALL results must belong to tenantA
          for (const user of results) {
            expect(user.tenantId).toBe(tenantA);
          }

          // No user from tenantB should appear
          expect(results.length).toBe(countA);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('softDelete should only affect entities of the specified tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        uuidArb,
        async (userId, tenantId, deletedBy) => {
          mockRepo.update.mockResolvedValue({ affected: 1 });
          mockRepo.softDelete.mockResolvedValue({ affected: 1 });

          await repository.softDelete(userId, tenantId, deletedBy);

          // Verify that update was called with tenantId filter
          expect(mockRepo.update).toHaveBeenCalledWith(
            { id: userId, tenantId },
            { updatedBy: deletedBy },
          );

          // Verify that softDelete was called with tenantId filter
          expect(mockRepo.softDelete).toHaveBeenCalledWith(
            { id: userId, tenantId },
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
