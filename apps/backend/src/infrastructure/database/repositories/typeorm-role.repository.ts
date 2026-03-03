import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository, QueryOptions } from '@domain/repositories';
import { Role, RolePermission, Permission } from '@domain/entities';
import { RoleOrmEntity } from '../entities/role.entity';
import { RolePermissionOrmEntity } from '../entities/role-permission.entity';
import { Action, PermissionScope } from '@axion/types';

@Injectable()
export class TypeOrmRoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repo: Repository<RoleOrmEntity>,
    @InjectRepository(RolePermissionOrmEntity)
    private readonly rpRepo: Repository<RolePermissionOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Role | null> {
    const entity = await this.repo.findOne({
      where: [
        { id, tenantId },
        { id, tenantId: undefined as any }, // global roles
      ],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(tenantId: string, options?: QueryOptions): Promise<Role[]> {
    const entities = await this.repo.find({
      where: [{ tenantId }, { tenantId: undefined as any }],
      relations: ['rolePermissions'],
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(role: Role): Promise<Role> {
    const saved = await this.repo.save({
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      description: role.description,
      scope: role.scope,
    });
    return this.toDomain(saved as RoleOrmEntity);
  }

  async softDelete(id: string, tenantId: string, deletedBy: string): Promise<void> {
    await this.repo.softDelete({ id });
  }

  async findByName(name: string, tenantId?: string): Promise<Role | null> {
    const where = tenantId ? { name, tenantId } : { name };
    const entity = await this.repo.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findWithPermissions(roleId: string): Promise<Role | null> {
    const entity = await this.repo.findOne({
      where: { id: roleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async getPermissionsForRoles(roleIds: string[]): Promise<Permission[]> {
    if (roleIds.length === 0) return [];

    const rps = await this.rpRepo
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .getMany();

    const seen = new Set<string>();
    const permissions: Permission[] = [];

    for (const rp of rps) {
      const p = (rp as any).permission;
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        permissions.push(
          new Permission({
            id: p.id,
            resource: p.resource,
            action: p.action as Action,
            scope: p.scope as PermissionScope,
            moduleId: p.moduleId,
            description: p.description,
          }),
        );
      }
    }

    return permissions;
  }

  private toDomain(orm: RoleOrmEntity): Role {
    const permissions = (orm.rolePermissions ?? []).map(
      (rp) => new RolePermission({ id: rp.id, roleId: rp.roleId, permissionId: rp.permissionId }),
    );
    return new Role({
      id: orm.id,
      tenantId: orm.tenantId,
      name: orm.name,
      description: orm.description,
      scope: orm.scope,
      permissions,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }
}
