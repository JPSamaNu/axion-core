import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoleOrmEntity } from './role.entity';
import { PermissionOrmEntity } from './permission.entity';

@Entity('role_permissions')
export class RolePermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_id' })
  roleId!: string;

  @Column({ name: 'permission_id' })
  permissionId!: string;

  @ManyToOne(() => RoleOrmEntity, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role!: RoleOrmEntity;

  @ManyToOne(() => PermissionOrmEntity, (perm) => perm.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionOrmEntity;
}
