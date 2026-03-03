import * as fc from 'fast-check';
import { AuditSubscriber } from '../../subscribers/audit.subscriber';
import { UserStatus } from '@axion/types';
import { UserOrmEntity } from '../../entities/user.entity';
import { TypeOrmUserRepository } from '../typeorm-user.repository';

/**
 * Propiedad 13: Campos de auditoría en operaciones CRUD
 * Valida: Requisitos 7.2, 7.3
 *
 * Para cualquier entidad auditable:
 * - Al crearla, createdAt debe ser la fecha actual y createdBy debe ser el userId del contexto
 * - Al actualizarla, updatedAt debe ser la fecha actual y updatedBy debe ser el userId del contexto
 *
 * Propiedad 14: Soft delete y exclusión en consultas
 * Valida: Requisitos 7.4, 7.5
 *
 * Para cualquier entidad eliminada mediante soft delete, el campo deletedAt debe ser no nulo.
 * Las consultas estándar del repositorio no deben incluir registros con deletedAt no nulo.
 */

const uuidArb = fc.uuid();

describe('Property 13: Campos de auditoría en operaciones CRUD', () => {
  let subscriber: AuditSubscriber;

  beforeEach(() => {
    subscriber = new AuditSubscriber();
  });

  it('beforeInsert should set createdAt and updatedAt to current date', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.emailAddress(),
        uuidArb,
        (userId, email, tenantId) => {
          const entity: any = {
            id: userId,
            tenantId,
            email,
            createdAt: undefined,
            updatedAt: undefined,
            createdBy: userId,
            updatedBy: userId,
          };

          const before = new Date();
          subscriber.beforeInsert({ entity } as any);
          const after = new Date();

          // createdAt must be set
          expect(entity.createdAt).toBeDefined();
          expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
          expect(entity.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());

          // updatedAt must be set
          expect(entity.updatedAt).toBeDefined();
          expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
          expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('beforeInsert should not overwrite existing createdAt', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
        (userId, existingDate) => {
          const entity: any = {
            id: userId,
            createdAt: existingDate,
            updatedAt: undefined,
          };

          subscriber.beforeInsert({ entity } as any);

          // createdAt should NOT be overwritten
          expect(entity.createdAt).toBe(existingDate);

          // updatedAt should be set
          expect(entity.updatedAt).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('beforeUpdate should always refresh updatedAt', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
        (userId, oldUpdatedAt) => {
          const entity: any = {
            id: userId,
            updatedAt: oldUpdatedAt,
          };

          const before = new Date();
          subscriber.beforeUpdate({ entity } as any);
          const after = new Date();

          // updatedAt must be refreshed to current time
          expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
          expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('createdBy and updatedBy should be preserved through save', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        uuidArb,
        fc.emailAddress(),
        (userId, tenantId, contextUserId, email) => {
          // When creating a user, createdBy and updatedBy come from the context
          const entity: any = {
            id: userId,
            tenantId,
            email,
            createdBy: contextUserId,
            updatedBy: contextUserId,
            createdAt: undefined,
            updatedAt: undefined,
          };

          subscriber.beforeInsert({ entity } as any);

          // createdBy and updatedBy must match the context userId
          expect(entity.createdBy).toBe(contextUserId);
          expect(entity.updatedBy).toBe(contextUserId);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 14: Soft delete y exclusión en consultas', () => {
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

  it('findAll without includeDeleted should exclude soft-deleted entities', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (tenantId, activeCount, deletedCount) => {
          const activeUsers: UserOrmEntity[] = [];
          const deletedUsers: UserOrmEntity[] = [];

          for (let i = 0; i < activeCount; i++) {
            const orm = new UserOrmEntity();
            orm.id = `active-${i}`;
            orm.tenantId = tenantId;
            orm.email = `active${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'Active';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = null;
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            activeUsers.push(orm);
          }

          for (let i = 0; i < deletedCount; i++) {
            const orm = new UserOrmEntity();
            orm.id = `deleted-${i}`;
            orm.tenantId = tenantId;
            orm.email = `deleted${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'Deleted';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = new Date(); // soft deleted
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            deletedUsers.push(orm);
          }

          const allUsers = [...activeUsers, ...deletedUsers];
          let appliedDeletedFilter = false;

          const mockQb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn(function (this: any, condition: string) {
              if (condition.includes('deletedAt IS NULL')) {
                appliedDeletedFilter = true;
              }
              return this;
            }),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn(async () => {
              // Simulate the query: filter by tenant and exclude deleted
              return allUsers.filter(
                (u) => u.tenantId === tenantId && (appliedDeletedFilter ? u.deletedAt === null : true),
              );
            }),
          };

          mockRepo.createQueryBuilder.mockReturnValue(mockQb);

          // Default query (no includeDeleted)
          const results = await repository.findAll(tenantId);

          // Should NOT include soft-deleted entities
          for (const user of results) {
            expect(user.deletedAt).toBeNull();
          }
          expect(results.length).toBe(activeCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('findAll with includeDeleted should return soft-deleted entities', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        async (tenantId, activeCount, deletedCount) => {
          const activeUsers: UserOrmEntity[] = [];
          const deletedUsers: UserOrmEntity[] = [];

          for (let i = 0; i < activeCount; i++) {
            const orm = new UserOrmEntity();
            orm.id = `active-${i}`;
            orm.tenantId = tenantId;
            orm.email = `active${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'Active';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = null;
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            activeUsers.push(orm);
          }

          for (let i = 0; i < deletedCount; i++) {
            const orm = new UserOrmEntity();
            orm.id = `deleted-${i}`;
            orm.tenantId = tenantId;
            orm.email = `deleted${i}@test.com`;
            orm.passwordHash = '$2b$10$hash';
            orm.firstName = 'Deleted';
            orm.lastName = `User${i}`;
            orm.status = UserStatus.ACTIVE;
            orm.createdAt = new Date();
            orm.updatedAt = new Date();
            orm.deletedAt = new Date();
            orm.createdBy = 'system';
            orm.updatedBy = 'system';
            orm.userRoles = [];
            deletedUsers.push(orm);
          }

          const allUsers = [...activeUsers, ...deletedUsers];
          let appliedDeletedFilter = false;

          const mockQb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn(function (this: any, condition: string) {
              if (condition.includes('deletedAt IS NULL')) {
                appliedDeletedFilter = true;
              }
              return this;
            }),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn(async () => {
              return allUsers.filter(
                (u) => u.tenantId === tenantId && (appliedDeletedFilter ? u.deletedAt === null : true),
              );
            }),
          };

          mockRepo.createQueryBuilder.mockReturnValue(mockQb);

          // Query with includeDeleted = true
          const results = await repository.findAll(tenantId, { includeDeleted: true });

          // Should include ALL entities (active + deleted)
          expect(results.length).toBe(activeCount + deletedCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('softDelete should set deletedAt to non-null via TypeORM softDelete', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        uuidArb,
        async (userId, tenantId, deletedBy) => {
          mockRepo.update.mockResolvedValue({ affected: 1 });
          mockRepo.softDelete.mockResolvedValue({ affected: 1 });

          await repository.softDelete(userId, tenantId, deletedBy);

          // TypeORM softDelete is called (sets deletedAt automatically)
          expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: userId, tenantId });

          // updatedBy is set to the deleting user before soft delete
          expect(mockRepo.update).toHaveBeenCalledWith(
            { id: userId, tenantId },
            { updatedBy: deletedBy },
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
