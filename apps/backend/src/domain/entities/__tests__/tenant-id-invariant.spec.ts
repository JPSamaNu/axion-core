/**
 * Property 1: Invariante de tenant_id en entidades
 * Validates: Requisitos 2.3, 2.6
 *
 * Para cualquier entidad tenant-aware creada dentro de un contexto de tenant,
 * el campo tenant_id debe ser no nulo y coincidir con el tenant_id del contexto
 * activo en el momento de la creación.
 */
import * as fc from 'fast-check';
import { User } from '../user.entity';
import { UserRole } from '../user-role.entity';
import { UserStatus } from '@axion/types';
import { CreateUserUseCase } from '@application/use-cases/users/create-user.use-case';
import { IUserRepository } from '@domain/repositories';
import { IPasswordHasher } from '@domain/services';
import { IEventDispatcher, DomainEvent } from '@domain/events';

describe('Property 1: Invariante de tenant_id en entidades', () => {
  it('User entity should always have non-null tenantId matching context', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.uuid(),
        (tenantId, userId, email, firstName, lastName, createdBy) => {
          const user = new User({
            id: userId,
            tenantId,
            email,
            passwordHash: 'hashed',
            firstName,
            lastName,
            createdBy,
            updatedBy: createdBy,
          });

          expect(user.tenantId).not.toBeNull();
          expect(user.tenantId).not.toBeUndefined();
          expect(user.tenantId).toBe(tenantId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('UserRole entity should always have non-null tenantId matching context', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        (tenantId, id, userId, roleId, assignedBy) => {
          const userRole = new UserRole({
            id,
            userId,
            roleId,
            tenantId,
            assignedBy,
          });

          expect(userRole.tenantId).not.toBeNull();
          expect(userRole.tenantId).not.toBeUndefined();
          expect(userRole.tenantId).toBe(tenantId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CreateUserUseCase should assign context tenantId to created user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (tenantId, contextUserId, email, firstName, lastName) => {
          let savedUser: User | null = null;

          const mockUserRepo: IUserRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn().mockImplementation(async (user: User) => {
              savedUser = user;
              return user;
            }),
            softDelete: jest.fn(),
            findByEmail: jest.fn(),
            findWithRoles: jest.fn(),
          };

          const mockHasher: IPasswordHasher = {
            hash: jest.fn().mockResolvedValue('hashed-password'),
            compare: jest.fn(),
          };

          const mockDispatcher: IEventDispatcher = {
            dispatch: jest.fn().mockResolvedValue(undefined),
            register: jest.fn(),
          };

          const useCase = new CreateUserUseCase(mockUserRepo, mockHasher, mockDispatcher);

          await useCase.execute(
            { email, password: 'Test123!', firstName, lastName } as any,
            { tenantId, userId: contextUserId },
          );

          expect(savedUser).not.toBeNull();
          expect(savedUser!.tenantId).toBe(tenantId);
          expect(savedUser!.tenantId).not.toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
