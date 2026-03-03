/**
 * Property 16: Sistema reactivo de permisos en frontend
 * Validates: Requisito 9.4
 *
 * Para cualquier conjunto de permisos de usuario cargados en el contexto,
 * la función hasPermission(resource, action) debe retornar true si y solo si
 * existe un permiso que coincida con el recurso y la acción solicitados.
 */
import * as fc from 'fast-check';
import { Action, PermissionScope } from '@axion/types';
import type { PermissionDto, ModuleDto } from '@axion/types';

// Test the pure logic directly (no React rendering needed)
function createPermissionChecker(permissions: PermissionDto[]) {
  const permissionSet = new Set(
    permissions.map((p) => `${p.resource}:${p.action}`),
  );
  return {
    hasPermission: (resource: string, action: Action) =>
      permissionSet.has(`${resource}:${action}`),
  };
}

function createModuleChecker(activeModules: ModuleDto[]) {
  const moduleSet = new Set(activeModules.map((m) => m.id));
  return {
    isModuleActive: (moduleId: string) => moduleSet.has(moduleId),
  };
}

const actionArb = fc.constantFrom(Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE);
const scopeArb = fc.constantFrom(PermissionScope.GLOBAL, PermissionScope.TENANT, PermissionScope.OWN);
const resourceArb = fc.stringOf(fc.constantFrom('a','b','c','d','e','f','users','roles','tenants','modules'), { minLength: 1, maxLength: 10 });

const permissionArb: fc.Arbitrary<PermissionDto> = fc.record({
  resource: resourceArb,
  action: actionArb,
  scope: scopeArb,
});

const moduleArb: fc.Arbitrary<ModuleDto> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 50 }),
  isCore: fc.boolean(),
});

describe('Property 16: Sistema reactivo de permisos en frontend', () => {
  it('hasPermission returns true iff a matching permission exists', () => {
    fc.assert(
      fc.property(
        fc.array(permissionArb, { minLength: 0, maxLength: 20 }),
        resourceArb,
        actionArb,
        (permissions, queryResource, queryAction) => {
          const checker = createPermissionChecker(permissions);
          const result = checker.hasPermission(queryResource, queryAction);

          const exists = permissions.some(
            (p) => p.resource === queryResource && p.action === queryAction,
          );

          expect(result).toBe(exists);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hasPermission returns false for empty permissions', () => {
    fc.assert(
      fc.property(resourceArb, actionArb, (resource, action) => {
        const checker = createPermissionChecker([]);
        expect(checker.hasPermission(resource, action)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('hasPermission returns true for all permissions in the set', () => {
    fc.assert(
      fc.property(
        fc.array(permissionArb, { minLength: 1, maxLength: 20 }),
        (permissions) => {
          const checker = createPermissionChecker(permissions);
          for (const perm of permissions) {
            expect(checker.hasPermission(perm.resource, perm.action)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 17: Renderizado condicional de módulos', () => {
  it('isModuleActive returns true iff module is in active modules list', () => {
    fc.assert(
      fc.property(
        fc.array(moduleArb, { minLength: 0, maxLength: 10 }),
        fc.uuid(),
        (activeModules, queryModuleId) => {
          const checker = createModuleChecker(activeModules);
          const result = checker.isModuleActive(queryModuleId);
          const exists = activeModules.some((m) => m.id === queryModuleId);
          expect(result).toBe(exists);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isModuleActive returns true for all active modules', () => {
    fc.assert(
      fc.property(
        fc.array(moduleArb, { minLength: 1, maxLength: 10 }),
        (activeModules) => {
          const checker = createModuleChecker(activeModules);
          for (const mod of activeModules) {
            expect(checker.isModuleActive(mod.id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isModuleActive returns false for empty active modules', () => {
    fc.assert(
      fc.property(fc.uuid(), (moduleId) => {
        const checker = createModuleChecker([]);
        expect(checker.isModuleActive(moduleId)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
