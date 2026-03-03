import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'requiredModule';

export const RequireModule = (moduleId: string) =>
  SetMetadata(MODULE_KEY, moduleId);
