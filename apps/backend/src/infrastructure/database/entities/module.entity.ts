import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantModuleOrmEntity } from './tenant-module.entity';
import { PermissionOrmEntity } from './permission.entity';

@Entity('modules')
export class ModuleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: '' })
  description!: string;

  @Column({ name: 'is_core', default: false })
  isCore!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @OneToMany(() => TenantModuleOrmEntity, (tm) => tm.module)
  tenantModules!: TenantModuleOrmEntity[];

  @OneToMany(() => PermissionOrmEntity, (p) => p.module)
  permissions!: PermissionOrmEntity[];
}
