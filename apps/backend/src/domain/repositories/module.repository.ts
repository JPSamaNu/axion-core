import { Module, TenantModule } from '../entities';
import { IBaseRepository } from './base.repository';

export interface IModuleRepository extends IBaseRepository<Module> {
  findActiveByTenant(tenantId: string): Promise<Module[]>;
  isModuleActiveForTenant(moduleId: string, tenantId: string): Promise<boolean>;
  saveTenantModule(tenantModule: TenantModule): Promise<TenantModule>;
  findTenantModule(moduleId: string, tenantId: string): Promise<TenantModule | null>;
}
