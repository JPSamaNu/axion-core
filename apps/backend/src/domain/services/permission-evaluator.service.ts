import { Action, PermissionScope } from '@axion/types';
import { Permission } from '../entities';

export interface PermissionContext {
  tenantId: string;
  userId: string;
  resourceOwnerId?: string;
  resourceTenantId?: string;
}

export interface IPermissionEvaluator {
  evaluate(
    userPermissions: Permission[],
    requiredResource: string,
    requiredAction: Action,
    context: PermissionContext,
  ): boolean;
}

export class PermissionEvaluator implements IPermissionEvaluator {
  evaluate(
    userPermissions: Permission[],
    requiredResource: string,
    requiredAction: Action,
    context: PermissionContext,
  ): boolean {
    const matching = userPermissions.filter(
      (p) => p.resource === requiredResource && p.action === requiredAction,
    );

    if (matching.length === 0) return false;

    return matching.some((permission) => {
      switch (permission.scope) {
        case PermissionScope.GLOBAL:
          return true;

        case PermissionScope.TENANT: {
          const resourceTenant = context.resourceTenantId ?? context.tenantId;
          return resourceTenant === context.tenantId;
        }

        case PermissionScope.OWN:
          return context.resourceOwnerId !== undefined && context.resourceOwnerId === context.userId;

        default:
          return false;
      }
    });
  }
}
