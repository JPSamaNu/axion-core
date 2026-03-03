import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IModuleRepository, QueryOptions } from '@domain/repositories';
import { Module, TenantModule } from '@domain/entities';
import { ModuleOrmEntity } from '../entities/module.entity';
import { TenantModuleOrmEntity } from '../entities/tenant-module.entity';

@Injectable()
export class TypeOrmModuleRepository implements IModuleRepository {
  constructor(
    @InjectRepository(ModuleOrmEntity)
    private readonly moduleRepo: Repository<ModuleOrmEntity>,
    @InjectRepository(TenantModuleOrmEntity)
    private readonly tenantModuleRepo: Repository<TenantModuleOrmEntity>,
  ) {}

  async findById(id: string, _tenantId: string): Promise<Module | null> {
    const entity = await this.moduleRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(_tenantId: string, _options?: QueryOptions): Promise<Module[]> {
    const entities = await this.moduleRepo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async save(module: Module): Promise<Module> {
    const saved = await this.moduleRepo.save({
      id: module.id,
      name: module.name,
      description: module.description,
      isCore: module.isCore,
    });
    return this.toDomain(saved as ModuleOrmEntity);
  }

  async softDelete(id: string, _tenantId: string, _deletedBy: string): Promise<void> {
    await this.moduleRepo.softDelete({ id });
  }

  async findActiveByTenant(tenantId: string): Promise<Module[]> {
    const tenantModules = await this.tenantModuleRepo.find({
      where: { tenantId, isActive: true },
      relations: ['module'],
    });
    return tenantModules
      .filter((tm) => tm.module)
      .map((tm) => this.toDomain(tm.module));
  }

  async isModuleActiveForTenant(moduleId: string, tenantId: string): Promise<boolean> {
    const tm = await this.tenantModuleRepo.findOne({
      where: { moduleId, tenantId, isActive: true },
    });
    return !!tm;
  }

  async saveTenantModule(tenantModule: TenantModule): Promise<TenantModule> {
    const saved = await this.tenantModuleRepo.save({
      id: tenantModule.id,
      tenantId: tenantModule.tenantId,
      moduleId: tenantModule.moduleId,
      isActive: tenantModule.isActive,
      activatedAt: tenantModule.activatedAt,
      deactivatedAt: tenantModule.deactivatedAt,
    });
    return new TenantModule({
      id: saved.id,
      tenantId: saved.tenantId,
      moduleId: saved.moduleId,
      isActive: saved.isActive,
      activatedAt: saved.activatedAt,
      deactivatedAt: saved.deactivatedAt,
    });
  }

  async findTenantModule(moduleId: string, tenantId: string): Promise<TenantModule | null> {
    const entity = await this.tenantModuleRepo.findOne({
      where: { moduleId, tenantId },
    });
    if (!entity) return null;
    return new TenantModule({
      id: entity.id,
      tenantId: entity.tenantId,
      moduleId: entity.moduleId,
      isActive: entity.isActive,
      activatedAt: entity.activatedAt,
      deactivatedAt: entity.deactivatedAt,
    });
  }

  private toDomain(orm: ModuleOrmEntity): Module {
    return new Module({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      isCore: orm.isCore,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }
}
