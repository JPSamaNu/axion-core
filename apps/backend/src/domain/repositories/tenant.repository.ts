import { Tenant } from '../entities';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  save(tenant: Tenant): Promise<Tenant>;
}
