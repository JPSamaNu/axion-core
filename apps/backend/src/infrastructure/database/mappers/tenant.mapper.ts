import { Tenant } from '@domain/entities';
import { TenantOrmEntity } from '../entities/tenant.entity';

export class TenantMapper {
  static toDomain(orm: TenantOrmEntity): Tenant {
    return new Tenant({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      status: orm.status,
      settings: orm.settings,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  static toOrm(domain: Tenant): Partial<TenantOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      status: domain.status,
      settings: domain.settings,
    };
  }
}
