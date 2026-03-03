import * as fc from 'fast-check';
import { CreateUserUseCase } from '../users/create-user.use-case';
import { AssignRoleUseCase } from '../roles/assign-role.use-case';
import { ToggleModuleUseCase } from '../modules/toggle-module.use-case';
import { UserCreatedEvent, RoleAssignedEvent, ModuleToggledEvent } from '@domain/events';
import { IEventDispatcher, DomainEvent } from '@domain/events';
import { User, Role, Module, TenantModule } from '@domain/entities';
import { UserStatus, RoleScope } from '@axion/types';
import { IUserRepository, IRoleRepository, IModuleRepository } from '@domain/repositories';
import { IPasswordHasher } from '@domain/services';

/**
 * Feature: saas-multi-tenant-core, Property 11: Emisión de Domain Events
 * **Valida: Requisitos 6.3, 6.4, 4.5**
 */
describe('Property 11: Emisión de Domain Events', () => {
  it('CreateUserUseCase should emit UserCreatedEvent with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (tenantId, userId, email, firstName, lastName) => {
          const dispatched: DomainEvent[] = [];

          const eventDispatcher: IEventDispatcher = {
            dispatch: jest.fn().mockImplementation(async (e) => dispatched.push(e)),
            register: jest.fn(),
          };

          const userRepo: IUserRepository = {
            save: jest.fn().mockImplementation(async (u: User) => u),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            softDelete: jest.fn(),
            findWithRoles: jest.fn(),
          };

          const hasher: IPasswordHasher = {
            hash: jest.fn().mockResolvedValue('hashed-pw'),
            compare: jest.fn(),
          };

          const useCase = new CreateUserUseCase(userRepo, hasher, eventDispatcher);
          await useCase.execute(
            { email, password: 'password123', firstName, lastName } as any,
            { tenantId, userId },
          );

          expect(dispatched.length).toBe(1);
          expect(dispatched[0]).toBeInstanceOf(UserCreatedEvent);
          expect(dispatched[0].payload).toMatchObject({ tenantId, email });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('AssignRoleUseCase should emit RoleAssignedEvent with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.uuid(), async (tenantId, targetUserId, roleId) => {
        const dispatched: DomainEvent[] = [];

        const eventDispatcher: IEventDispatcher = {
          dispatch: jest.fn().mockImplementation(async (e) => dispatched.push(e)),
          register: jest.fn(),
        };

        const user = new User({
          id: targetUserId,
          tenantId,
          email: 'test@test.com',
          passwordHash: 'hashed',
          firstName: 'Test',
          lastName: 'User',
          status: UserStatus.ACTIVE,
          createdBy: 'system',
          updatedBy: 'system',
        });

        const role = new Role({
          id: roleId,
          name: 'admin',
          description: 'Admin role',
          scope: RoleScope.TENANT,
        });

        const userRepo: IUserRepository = {
          findById: jest.fn().mockResolvedValue(user),
          save: jest.fn().mockImplementation(async (u: User) => u),
          findByEmail: jest.fn(),
          findAll: jest.fn(),
          softDelete: jest.fn(),
          findWithRoles: jest.fn(),
        };

        const roleRepo: IRoleRepository = {
          findWithPermissions: jest.fn().mockResolvedValue(role),
          findById: jest.fn(),
          findByName: jest.fn(),
          findAll: jest.fn(),
          save: jest.fn(),
          softDelete: jest.fn(),
          getPermissionsForRoles: jest.fn().mockResolvedValue([]),
        };

        const useCase = new AssignRoleUseCase(userRepo, roleRepo, eventDispatcher);
        await useCase.execute(
          { userId: targetUserId, roleId } as any,
          { tenantId, userId: 'assigner-id' },
        );

        expect(dispatched.length).toBe(1);
        expect(dispatched[0]).toBeInstanceOf(RoleAssignedEvent);
        expect(dispatched[0].payload).toMatchObject({
          userId: targetUserId,
          roleId,
          tenantId,
        });
      }),
      { numRuns: 100 },
    );
  });

  it('ToggleModuleUseCase should emit ModuleToggledEvent with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.boolean(),
        async (tenantId, moduleId, isActive) => {
          const dispatched: DomainEvent[] = [];

          const eventDispatcher: IEventDispatcher = {
            dispatch: jest.fn().mockImplementation(async (e) => dispatched.push(e)),
            register: jest.fn(),
          };

          const module = new Module({
            id: moduleId,
            name: 'test-module',
            description: 'Test',
          });

          const moduleRepo: IModuleRepository = {
            findById: jest.fn().mockResolvedValue(module),
            findTenantModule: jest.fn().mockResolvedValue(null),
            saveTenantModule: jest.fn().mockImplementation(async (tm: TenantModule) => tm),
            findActiveByTenant: jest.fn(),
            isModuleActiveForTenant: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          };

          const useCase = new ToggleModuleUseCase(moduleRepo, eventDispatcher);
          await useCase.execute({ moduleId, isActive } as any, { tenantId, userId: 'user-id' });

          expect(dispatched.length).toBe(1);
          expect(dispatched[0]).toBeInstanceOf(ModuleToggledEvent);
          expect(dispatched[0].payload).toMatchObject({
            moduleId,
            tenantId,
            isActive,
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
