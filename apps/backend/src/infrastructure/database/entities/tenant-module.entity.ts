import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantOrmEntity } from './tenant.entity';
import { ModuleOrmEntity } from './module.entity';

@Entity('tenant_modules')
export class TenantModuleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'module_id' })
  moduleId!: string;

  @Column({ name: 'is_active', default: false })
  isActive!: boolean;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt!: Date | null;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt!: Date | null;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.tenantModules)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantOrmEntity;

  @ManyToOne(() => ModuleOrmEntity, (module) => module.tenantModules)
  @JoinColumn({ name: 'module_id' })
  module!: ModuleOrmEntity;
}
