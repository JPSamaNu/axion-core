import { randomUUID } from 'crypto';
import { IModuleRepository } from '@domain/repositories';
import { IEventDispatcher, ModuleToggledEvent } from '@domain/events';
import { EntityNotFoundError } from '@domain/errors';
import { TenantModule } from '@domain/entities';
import { ToggleModuleDto } from '../../dto';
import { TenantContext } from '../../types';

export class ToggleModuleUseCase {
  constructor(
    private readonly moduleRepo: IModuleRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async execute(dto: ToggleModuleDto, context: TenantContext): Promise<void> {
    const module = await this.moduleRepo.findById(dto.moduleId, context.tenantId);
    if (!module) {
      throw new EntityNotFoundError('Module', dto.moduleId);
    }

    let tenantModule = await this.moduleRepo.findTenantModule(dto.moduleId, context.tenantId);

    if (tenantModule) {
      tenantModule.isActive = dto.isActive;
      tenantModule.activatedAt = dto.isActive ? new Date() : tenantModule.activatedAt;
      tenantModule.deactivatedAt = dto.isActive ? null : new Date();
    } else {
      tenantModule = new TenantModule({
        id: randomUUID(),
        tenantId: context.tenantId,
        moduleId: dto.moduleId,
        isActive: dto.isActive,
        activatedAt: dto.isActive ? new Date() : null,
        deactivatedAt: dto.isActive ? null : new Date(),
      });
    }

    await this.moduleRepo.saveTenantModule(tenantModule);

    await this.eventDispatcher.dispatch(
      new ModuleToggledEvent(dto.moduleId, {
        moduleId: dto.moduleId,
        tenantId: context.tenantId,
        isActive: dto.isActive,
      }),
    );
  }
}
