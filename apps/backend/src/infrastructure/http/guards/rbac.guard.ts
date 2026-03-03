import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';
import { IPermissionEvaluator } from '@domain/services';
import { IRoleRepository, IModuleRepository } from '@domain/repositories';
import { TOKENS } from '../../di/tokens';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKENS.PERMISSION_EVALUATOR)
    private readonly permissionEvaluator: IPermissionEvaluator,
    @Inject(TOKENS.ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(TOKENS.MODULE_REPOSITORY)
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const allPermissions = await this.roleRepository.getPermissionsForRoles(user.roles);

    // Filter out permissions linked to inactive modules (Req 4.6)
    const activePermissions = [];
    for (const perm of allPermissions) {
      if (perm.moduleId) {
        const isActive = await this.moduleRepository.isModuleActiveForTenant(
          perm.moduleId,
          user.tenantId,
        );
        if (!isActive) continue;
      }
      activePermissions.push(perm);
    }

    const granted = this.permissionEvaluator.evaluate(
      activePermissions,
      required.resource,
      required.action,
      {
        tenantId: user.tenantId,
        userId: user.userId,
      },
    );

    if (!granted) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
