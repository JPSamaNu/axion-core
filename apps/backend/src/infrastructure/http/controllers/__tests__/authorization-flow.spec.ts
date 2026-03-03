import { UsersController } from '../users.controller';
import { RolesController } from '../roles.controller';
import { CreateUserUseCase, AssignRoleUseCase } from '@application/use-cases';
import { UserResponseDto } from '@application/dto';
import { User, Role, RolePermission } from '@domain/entities';
import { IUserRepository, IRoleRepository } from '@domain/repositories';
import { UserStatus, RoleScope } from '@axion/types';

describe('Authorization Flow: create user → assign role → verify access', () => {
  let usersController: UsersController;
  let rolesController: RolesController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let assignRoleUseCase: jest.Mocked<AssignRoleUseCase>;
  let userRepo: jest.Mocked<IUserRepository>;
  let roleRepo: jest.Mocked<IRoleRepository>;

  const tenantId = 'tenant-1';
  const adminUserId = 'admin-1';

  const mockUser = new User({
    id: 'new-user-1',
    tenantId,
    email: 'new@example.com',
    passwordHash: 'hashed',
    firstName: 'New',
    lastName: 'User',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  const mockRole = new Role({
    id: 'role-1',
    name: 'Editor',
    description: 'Can edit content',
    scope: RoleScope.TENANT,
    tenantId,
    permissions: [
      new RolePermission({ id: 'rp-1', roleId: 'role-1', permissionId: 'perm-1' }),
    ],
  });

  beforeEach(() => {
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

    usersController = new UsersController(createUserUseCase, userRepo);
    rolesController = new RolesController(assignRoleUseCase, roleRepo);
  });

  it('should create user, assign role, and verify role is accessible', async () => {
    // Step 1: Create user
    const userResponse = new UserResponseDto(mockUser);
    createUserUseCase.execute.mockResolvedValue(userResponse);

    const created = await usersController.create(
      { email: 'new@example.com', password: 'Pass123!', firstName: 'New', lastName: 'User' } as any,
      { user: { tenantId, userId: adminUserId } },
    );
    expect(created.id).toBe('new-user-1');
    expect(created.email).toBe('new@example.com');

    // Step 2: Assign role
    assignRoleUseCase.execute.mockResolvedValue(undefined);
    await rolesController.assignRole(
      { userId: 'new-user-1', roleId: 'role-1' } as any,
      { user: { tenantId, userId: adminUserId } },
    );
    expect(assignRoleUseCase.execute).toHaveBeenCalledWith(
      { userId: 'new-user-1', roleId: 'role-1' },
      { tenantId, userId: adminUserId },
    );

    // Step 3: Verify role is accessible via roles endpoint
    roleRepo.findWithPermissions.mockResolvedValue(mockRole);
    const role = await rolesController.findOne('role-1');
    expect(role).toBeDefined();
    expect(role!.name).toBe('Editor');
    expect(role!.permissions).toHaveLength(1);
  });

  it('should list users filtered by tenant', async () => {
    userRepo.findAll.mockResolvedValue([mockUser]);

    const users = await usersController.findAll({ user: { tenantId } });
    expect(users).toHaveLength(1);
    expect(userRepo.findAll).toHaveBeenCalledWith(tenantId);
  });
});
