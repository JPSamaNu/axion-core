import { User, UserRole } from '@domain/entities';
import { UserOrmEntity } from '../entities/user.entity';
import { UserRoleOrmEntity } from '../entities/user-role.entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    const roles = (orm.userRoles ?? []).map(
      (ur) =>
        new UserRole({
          id: ur.id,
          userId: ur.userId,
          roleId: ur.roleId,
          tenantId: ur.tenantId,
          assignedAt: ur.assignedAt,
          assignedBy: ur.assignedBy,
        }),
    );

    return new User({
      id: orm.id,
      tenantId: orm.tenantId,
      email: orm.email,
      passwordHash: orm.passwordHash,
      firstName: orm.firstName,
      lastName: orm.lastName,
      status: orm.status,
      roles,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
      createdBy: orm.createdBy,
      updatedBy: orm.updatedBy,
    });
  }

  static toOrm(domain: User): Partial<UserOrmEntity> {
    return {
      id: domain.id,
      tenantId: domain.tenantId,
      email: domain.email,
      passwordHash: domain.passwordHash,
      firstName: domain.firstName,
      lastName: domain.lastName,
      status: domain.status,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
    };
  }
}
