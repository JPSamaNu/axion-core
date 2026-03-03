import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Action, PermissionScope } from '@axion/types';
import { ModuleOrmEntity } from './module.entity';
import { RolePermissionOrmEntity } from './role-permission.entity';

@Entity('permissions')
export class PermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  resource!: string;

  @Column({ type: 'enum', enum: Action })
  action!: Action;

  @Column({ type: 'enum', enum: PermissionScope })
  scope!: PermissionScope;

  @Column({ name: 'module_id', nullable: true })
  moduleId!: string | null;

  @Column({ default: '' })
  description!: string;

  @ManyToOne(() => ModuleOrmEntity, (m) => m.permissions, { nullable: true })
  @JoinColumn({ name: 'module_id' })
  module!: ModuleOrmEntity;

  @OneToMany(() => RolePermissionOrmEntity, (rp) => rp.permission)
  rolePermissions!: RolePermissionOrmEntity[];
}
