import * as fc from 'fast-check';
import { ModuleGuard } from '../module.guard';
import { ForbiddenException } from '@nestjs/common';
import { Action, PermissionScope } from '@axion/types';
import { Permission } from '@domain/entities';
import { PermissionEvaluator } from '@domain/services/permission-evaluator.service';

/**
 * Propiedad 4: Guard de módulo activo
 * Valida: Requisitos 4.3, 4.4
 *
 * Para cualquier petición a un endpoint asociado a un módulo, el guard debe
 * permitir el acceso si y solo si el módulo está activo para el tenant del contexto.
 *
 * Propiedad 5: Permisos de módulo inactivo no conceden acceso
 * Valida: Requisito 4.6
 *
 * Para cualquier usuario con permisos vinculados a un módulo que está inactivo
 * para su tenant, esos permisos no deben conceder acceso.
 */

const uuidArb = fc.uuid();

function createMockExecutionContext(tenantId: string, user?: any, moduleId?: string) {
  const request = { tenantId, user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('Property 4: Guard de módulo activo', () => {
  it('should allow access when module is active for tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        async (moduleId, tenantId) => {
          const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(moduleId),
          };

          const mockModuleRepo = {
            isModuleActiveForTenant: jest.fn().mockResolvedValue(true),
          };

          const guard = new ModuleGuard(mockReflector as any, mockModuleRepo as any);
          const context = createMockExecutionContext(tenantId);

          const result = await guard.canActivate(context);

          expect(result).toBe(true);
          expect(mockModuleRepo.isModuleActiveForTenant).toHaveBeenCalledWith(moduleId, tenantId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should deny access when module is inactive for tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        async (moduleId, tenantId) => {
          const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(moduleId),
          };

          const mockModuleRepo = {
            isModuleActiveForTenant: jest.fn().mockResolvedValue(false),
          };

          const guard = new ModuleGuard(mockReflector as any, mockModuleRepo as any);
          const context = createMockExecutionContext(tenantId);

          await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow access when no module is required (no decorator)', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (tenantId) => {
          const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(undefined),
          };

          const mockModuleRepo = {
            isModuleActiveForTenant: jest.fn(),
          };

          const guard = new ModuleGuard(mockReflector as any, mockModuleRepo as any);
          const context = createMockExecutionContext(tenantId);

          const result = await guard.canActivate(context);

          expect(result).toBe(true);
          expect(mockModuleRepo.isModuleActiveForTenant).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 5: Permisos de módulo inactivo no conceden acceso', () => {
  const evaluator = new PermissionEvaluator();

  it('permissions linked to inactive module should not grant access when module check is enforced', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        uuidArb,
        fc.constantFrom(Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE),
        fc.constantFrom('users', 'roles', 'tenants', 'reports'),
        async (moduleId, tenantId, userId, action, resource) => {
          // User has a permission linked to a module
          const permission = new Permission({
            id: 'perm-1',
            resource,
            action,
            scope: PermissionScope.GLOBAL,
            moduleId,
            description: 'test',
          });

          // The permission evaluator itself grants access (GLOBAL scope)
          const permissionGranted = evaluator.evaluate(
            [permission],
            resource,
            action,
            { tenantId, userId },
          );
          expect(permissionGranted).toBe(true);

          // But the ModuleGuard should block access when module is inactive
          const mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(moduleId),
          };

          const mockModuleRepo = {
            isModuleActiveForTenant: jest.fn().mockResolvedValue(false),
          };

          const guard = new ModuleGuard(mockReflector as any, mockModuleRepo as any);
          const context = createMockExecutionContext(tenantId, { userId, tenantId, roles: [] });

          // Even though permission evaluator says yes, module guard says no
          await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        },
      ),
      { numRuns: 100 },
    );
  });
});
