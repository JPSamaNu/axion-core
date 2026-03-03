/**
 * Task 13.3: Tests unitarios de integración end-to-end
 *
 * Verifica:
 * 1. Flujo completo: crear tenant → crear usuario → login → asignar rol → acceder recurso protegido
 * 2. Aislamiento: usuario de tenant A no puede acceder datos de tenant B
 * 3. Módulos: desactivar módulo → permisos del módulo no conceden acceso
 *
 * Validates: Requisitos 2.5, 3.5, 4.6
 */
import { AuthController } from '../auth.controller';
import { UsersController } from '../users.controller';
import { RolesController } from '../roles.controller';
import { ModulesController } from '../modules.controller';
import { LoginUseCase, RefreshTokenUseCase, LogoutUseCase, CreateUserUseCase, AssignRoleUseCase, ToggleModuleUseCase } from '@application/use-cases';
import { AuthTokensDto, UserResponseDto } from '@application/dto';
import { User, Role, Permission, RolePermission, UserRole, Module, TenantModule } from '@domain/entities';
import { IUserRepository, IRoleRepository, IModuleRepository } from '@domain/repositories';
import { PermissionEvaluator } from '@domain/services';
import { RBACGuard } from '../../guards/rbac.guard';
import { ModuleGuard } from '../../guards/module.guard';
import { Reflector } from '@nestjs/core';
import { Action, PermissionScope, RoleScope, UserStatus } from '@axion/types';
import { ForbiddenException } from '@nestjs/common';

describe('E2E Integration: Full Flow', () => {
  // --- Shared state ---
  const tenantAId = 'tenant-a-id';
  const tenantBId = 'tenant-b-id';
  const adminUserId = 'admin-user-id';
  const moduleUsersId = 'module-users-id';

  // --- Entities ---
  const userTenantA = new User({
    id: 'user-a-1',
    tenantId: tenantAId,
    email: 'alice@tenanta.com',
    passwordHash: 'hashed-pass',
    firstName: 'Alice',
    lastName: 'Smith',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  userTenantA.roles = [
    new UserRole({ id: 'ur-1', userId: 'user-a-1', roleId: 'role-editor', tenantId: tenantAId, assignedBy: adminUserId }),
  ];

  const userTenantB = new User({
    id: 'user-b-1',
    tenantId: tenantBId,
    email: 'bob@tenantb.com',
    passwordHash: 'hashed-pass',
    firstName: 'Bob',
    lastName: 'Jones',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  const permReadUsers = new Permission({
    id: 'perm-read-users',
    resource: 'users',
    action: Action.READ,
    scope: PermissionScope.TENANT,
    moduleId: moduleUsersId,
    description: 'Read users in tenant',
  });

  const permCreateUsers = new Permission({
    id: 'perm-create-users',
    resource: 'users',
    action: Action.CREATE,
    scope: PermissionScope.TENANT,
    moduleId: moduleUsersId,
    description: 'Create users in tenant',
  });

  const editorRole = new Role({
    id: 'role-editor',
    name: 'Editor',
    description: 'Can read and create users',
    scope: RoleScope.TENANT,
    tenantId: tenantAId,
    permissions: [
      new RolePermission({ id: 'rp-1', roleId: 'role-editor', permissionId: 'perm-read-users' }),
      new RolePermission({ id: 'rp-2', roleId: 'role-editor', permissionId: 'perm-create-users' }),
    ],
  });

  describe('1. Full flow: create user → login → assign role → access protected resource', () => {
    let authController: AuthController;
    let usersController: UsersController;
    let rolesController: RolesController;
    let loginUseCase: jest.Mocked<LoginUseCase>;
    let createUserUseCase: jest.Mocked<CreateUserUseCase>;
    let assignRoleUseCase: jest.Mocked<AssignRoleUseCase>;
    let userRepo: jest.Mocked<IUserRepository>;
    let roleRepo: jest.Mocked<IRoleRepository>;

    beforeEach(() => {
      loginUseCase = { execute: jest.fn() } as any;
      createUserUseCase = { execute: jest.fn() } as any;
      assignRoleUseCase = { execute: jest.fn() } as any;
      userRepo = {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        findByEmail: jest.fn(),
        findWithRoles: jest.fn(),
      } as any;
      roleRepo = {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        findByName: jest.fn(),
        findWithPermissions: jest.fn(),
        getPermissionsForRoles: jest.fn(),
      } as any;

      authController = new AuthController(loginUseCase, { execute: jest.fn() } as any, { execute: jest.fn() } as any);
      usersController = new UsersController(createUserUseCase, userRepo);
      rolesController = new RolesController(assignRoleUseCase, roleRepo);
    });

    it('should complete full flow: create user → login → assign role → list users', async () => {
      // Step 1: Create user in tenant A
      const userResponse = new UserResponseDto(userTenantA);
      createUserUseCase.execute.mockResolvedValue(userResponse);

      const created = await usersController.create(
        { email: 'alice@tenanta.com', password: 'Pass123!', firstName: 'Alice', lastName: 'Smith' } as any,
        { user: { tenantId: tenantAId, userId: adminUserId } },
      );
      expect(created.id).toBe('user-a-1');
      expect(created.tenantId).toBe(tenantAId);

      // Step 2: Login as the created user
      const tokens = new AuthTokensDto({
        accessToken: 'jwt-access-token',
        refreshToken: 'refresh-token-1',
        user: userResponse,
      });
      loginUseCase.execute.mockResolvedValue(tokens);

      const loginResult = await authController.login(
        { email: 'alice@tenanta.com', password: 'Pass123!' } as any,
        { tenantId: tenantAId },
      );
      expect(loginResult.accessToken).toBe('jwt-access-token');
      expect(loginResult.user.email).toBe('alice@tenanta.com');

      // Step 3: Assign editor role
      assignRoleUseCase.execute.mockResolvedValue(undefined);
      await rolesController.assignRole(
        { userId: 'user-a-1', roleId: 'role-editor' } as any,
        { user: { tenantId: tenantAId, userId: adminUserId } },
      );
      expect(assignRoleUseCase.execute).toHaveBeenCalledWith(
        { userId: 'user-a-1', roleId: 'role-editor' },
        { tenantId: tenantAId, userId: adminUserId },
      );

      // Step 4: Access protected resource (list users)
      userRepo.findAll.mockResolvedValue([userTenantA]);
      const users = await usersController.findAll({ user: { tenantId: tenantAId } });
      expect(users).toHaveLength(1);
      expect(users[0].tenantId).toBe(tenantAId);
    });
  });

  describe('2. Tenant isolation: user of tenant A cannot access tenant B data', () => {
    let userRepo: jest.Mocked<IUserRepository>;
    let usersController: UsersController;

    beforeEach(() => {
      userRepo = {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        findByEmail: jest.fn(),
        findWithRoles: jest.fn(),
      } as any;
      usersController = new UsersController({ execute: jest.fn() } as any, userRepo);
    });

    it('should only return users from the requesting tenant', async () => {
      // Tenant A has users, tenant B has different users
      userRepo.findAll.mockImplementation(async (tenantId: string) => {
        if (tenantId === tenantAId) return [userTenantA];
        if (tenantId === tenantBId) return [userTenantB];
        return [];
      });

      // User from tenant A requests users
      const usersA = await usersController.findAll({ user: { tenantId: tenantAId } });
      expect(usersA).toHaveLength(1);
      expect(usersA[0].tenantId).toBe(tenantAId);
      expect(usersA.every((u: User) => u.tenantId === tenantAId)).toBe(true);

      // User from tenant B requests users
      const usersB = await usersController.findAll({ user: { tenantId: tenantBId } });
      expect(usersB).toHaveLength(1);
      expect(usersB[0].tenantId).toBe(tenantBId);
      expect(usersB.every((u: User) => u.tenantId === tenantBId)).toBe(true);

      // No cross-tenant data leakage
      expect(usersA[0].id).not.toBe(usersB[0].id);
    });

    it('should not find user by ID across tenants', async () => {
      userRepo.findById.mockImplementation(async (id: string, tenantId: string) => {
        if (id === 'user-a-1' && tenantId === tenantAId) return userTenantA;
        return null; // Not found in other tenant
      });

      // Tenant A can find their own user
      const found = await usersController.findOne('user-a-1', { user: { tenantId: tenantAId } });
      expect(found).not.toBeNull();
      expect(found!.id).toBe('user-a-1');

      // Tenant B cannot find tenant A's user
      const notFound = await usersController.findOne('user-a-1', { user: { tenantId: tenantBId } });
      expect(notFound).toBeNull();
    });
  });

  describe('3. Module deactivation: inactive module permissions do not grant access', () => {
    let rbacGuard: RBACGuard;
    let reflector: Reflector;
    let roleRepo: jest.Mocked<IRoleRepository>;
    let moduleRepo: jest.Mocked<IModuleRepository>;
    const permissionEvaluator = new PermissionEvaluator();

    beforeEach(() => {
      reflector = new Reflector();
      roleRepo = {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        findByName: jest.fn(),
        findWithPermissions: jest.fn(),
        getPermissionsForRoles: jest.fn(),
      } as any;
      moduleRepo = {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
        findActiveByTenant: jest.fn(),
        isModuleActiveForTenant: jest.fn(),
        saveTenantModule: jest.fn(),
        findTenantModule: jest.fn(),
      } as any;

      rbacGuard = new RBACGuard(reflector, permissionEvaluator, roleRepo, moduleRepo);
    });

    function createMockContext(user: any, requiredPermission: any) {
      const handler = jest.fn();
      const cls = jest.fn();
      // Override reflector to return the required permission
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredPermission);

      return {
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
        getHandler: () => handler,
        getClass: () => cls,
      } as any;
    }

    it('should grant access when module is active and user has permission', async () => {
      roleRepo.getPermissionsForRoles.mockResolvedValue([permReadUsers]);
      moduleRepo.isModuleActiveForTenant.mockResolvedValue(true);

      const context = createMockContext(
        { userId: 'user-a-1', tenantId: tenantAId, roles: ['role-editor'] },
        { resource: 'users', action: Action.READ },
      );

      const result = await rbacGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access when module is inactive even if user has permission', async () => {
      roleRepo.getPermissionsForRoles.mockResolvedValue([permReadUsers]);
      // Module is INACTIVE
      moduleRepo.isModuleActiveForTenant.mockResolvedValue(false);

      const context = createMockContext(
        { userId: 'user-a-1', tenantId: tenantAId, roles: ['role-editor'] },
        { resource: 'users', action: Action.READ },
      );

      await expect(rbacGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when module is deactivated after being active', async () => {
      // First call: module active → access granted
      roleRepo.getPermissionsForRoles.mockResolvedValue([permReadUsers]);
      moduleRepo.isModuleActiveForTenant.mockResolvedValueOnce(true);

      const context1 = createMockContext(
        { userId: 'user-a-1', tenantId: tenantAId, roles: ['role-editor'] },
        { resource: 'users', action: Action.READ },
      );
      expect(await rbacGuard.canActivate(context1)).toBe(true);

      // Second call: module deactivated → access denied
      moduleRepo.isModuleActiveForTenant.mockResolvedValueOnce(false);

      const context2 = createMockContext(
        { userId: 'user-a-1', tenantId: tenantAId, roles: ['role-editor'] },
        { resource: 'users', action: Action.READ },
      );
      await expect(rbacGuard.canActivate(context2)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access for permissions not linked to any module', async () => {
      const permNoModule = new Permission({
        id: 'perm-global',
        resource: 'settings',
        action: Action.READ,
        scope: PermissionScope.GLOBAL,
        moduleId: null,
        description: 'Read settings (no module)',
      });

      roleRepo.getPermissionsForRoles.mockResolvedValue([permNoModule]);

      const context = createMockContext(
        { userId: 'user-a-1', tenantId: tenantAId, roles: ['role-admin'] },
        { resource: 'settings', action: Action.READ },
      );

      const result = await rbacGuard.canActivate(context);
      expect(result).toBe(true);
      // isModuleActiveForTenant should NOT be called for permissions without moduleId
      expect(moduleRepo.isModuleActiveForTenant).not.toHaveBeenCalled();
    });
  });
});
