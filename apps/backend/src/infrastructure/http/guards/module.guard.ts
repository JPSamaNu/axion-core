import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/require-module.decorator';
import { IModuleRepository } from '@domain/repositories';
import { TOKENS } from '../../di/tokens';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKENS.MODULE_REPOSITORY)
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModuleId = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModuleId) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Contexto de tenant no disponible');
    }

    const isActive = await this.moduleRepository.isModuleActiveForTenant(
      requiredModuleId,
      tenantId,
    );

    if (!isActive) {
      throw new ForbiddenException('Módulo no activo para este tenant');
    }

    return true;
  }
}
