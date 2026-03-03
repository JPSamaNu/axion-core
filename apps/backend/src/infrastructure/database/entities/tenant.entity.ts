import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantStatus } from '@axion/types';
import { UserOrmEntity } from './user.entity';
import { TenantModuleOrmEntity } from './tenant-module.entity';

@Entity('tenants')
export class TenantOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status!: TenantStatus;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => UserOrmEntity, (user) => user.tenant)
  users!: UserOrmEntity[];

  @OneToMany(() => TenantModuleOrmEntity, (tm) => tm.tenant)
  tenantModules!: TenantModuleOrmEntity[];
}
