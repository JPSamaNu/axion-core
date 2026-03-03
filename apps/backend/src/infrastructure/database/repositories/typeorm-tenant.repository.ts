import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITenantRepository } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { TenantOrmEntity } from '../entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';

@Injectable()
export class TypeOrmTenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly repo: Repository<TenantOrmEntity>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TenantMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const entity = await this.repo.findOne({ where: { slug } });
    return entity ? TenantMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Tenant[]> {
    const entities = await this.repo.find();
    return entities.map(TenantMapper.toDomain);
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const orm = TenantMapper.toOrm(tenant);
    const saved = await this.repo.save(orm);
    return TenantMapper.toDomain(saved as TenantOrmEntity);
  }
}
