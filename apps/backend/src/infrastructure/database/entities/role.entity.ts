import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { RoleScope } from '@axion/types';
import { RolePermissionOrmEntity } from './role-permission.entity';
import { UserRoleOrmEntity } from './user-role.entity';

@Entity('roles')
export class RoleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column()
  name!: string;

  @Column({ default: '' })
  description!: string;

  @Column({ type: 'enum', enum: RoleScope, default: RoleScope.TENANT })
  scope!: RoleScope;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @OneToMany(() => RolePermissionOrmEntity, (rp) => rp.role)
  rolePermissions!: RolePermissionOrmEntity[];

  @OneToMany(() => UserRoleOrmEntity, (ur) => ur.role)
  userRoles!: UserRoleOrmEntity[];
}
