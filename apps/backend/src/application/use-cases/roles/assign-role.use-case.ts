import { randomUUID } from 'crypto';
import { IUserRepository, IRoleRepository } from '@domain/repositories';
import { IEventDispatcher, RoleAssignedEvent } from '@domain/events';
import { EntityNotFoundError } from '@domain/errors';
import { UserRole } from '@domain/entities';
import { AssignRoleDto } from '../../dto';
import { TenantContext } from '../../types';

export class AssignRoleUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async execute(dto: AssignRoleDto, context: TenantContext): Promise<void> {
    const user = await this.userRepo.findById(dto.userId, context.tenantId);
    if (!user) {
      throw new EntityNotFoundError('User', dto.userId);
    }

    const role = await this.roleRepo.findWithPermissions(dto.roleId);
    if (!role) {
      throw new EntityNotFoundError('Role', dto.roleId);
    }

    const userRole = new UserRole({
      id: randomUUID(),
      userId: dto.userId,
      roleId: dto.roleId,
      tenantId: context.tenantId,
      assignedBy: context.userId,
    });

    user.roles.push(userRole);
    await this.userRepo.save(user);

    await this.eventDispatcher.dispatch(
      new RoleAssignedEvent(user.id, {
        userId: dto.userId,
        roleId: dto.roleId,
        tenantId: context.tenantId,
      }),
    );
  }
}
