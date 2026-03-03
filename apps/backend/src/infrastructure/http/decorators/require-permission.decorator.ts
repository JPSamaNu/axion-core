import { SetMetadata } from '@nestjs/common';
import { Action } from '@axion/types';

export const PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  resource: string;
  action: Action;
}

export const RequirePermission = (resource: string, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequiredPermission);
