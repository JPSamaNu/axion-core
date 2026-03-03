import * as fc from 'fast-check';
import { PermissionEvaluator } from '../permission-evaluator.service';
import { Permission } from '@domain/entities';
import { Action, PermissionScope } from '@axion/types';

const evaluator = new PermissionEvaluator();

const actionArb = fc.constantFrom(Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE);
const scopeArb = fc.constantFrom(PermissionScope.GLOBAL, PermissionScope.TENANT, PermissionScope.OWN);
const resourceArb = fc.stringOf(fc.constantFrom('users', 'roles', 'tenants', 'modules', 'reports'), {
  minLength: 1,
  maxLength: 1,
});

const makePermission = (resource: string, action: Action, scope: PermissionScope): Permission =>
  new Permission({
    id: 'perm-id',
    resource,
    action,
    scope,
    description: 'test',
  });

/**
 * Feature: saas-multi-tenant-core, Property 3: Evaluación de permisos RBAC
 * **Valida: Requisitos 3.5, 3.6, 3.7**
 */
describe('Property 3: Evaluación de permisos RBAC', () => {
  it('GLOBAL scope should always grant access when resource and action match', async () => {
    await fc.assert(
      fc.asyncProperty(resourceArb, actionArb, fc.uuid(), fc.uuid(), async (resource, action, tenantId, userId) => {
        const permissions = [makePermission(resource, action, PermissionScope.GLOBAL)];
        const result = evaluator.evaluate(permissions, resource, action, { tenantId, userId });
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('TENANT scope should grant access when resource belongs to same tenant', async () => {
    await fc.assert(
      fc.asyncProperty(resourceArb, actionArb, fc.uuid(), fc.uuid(), async (resource, action, tenantId, userId) => {
        const permissions = [makePermission(resource, action, PermissionScope.TENANT)];
        const result = evaluator.evaluate(permissions, resource, action, {
          tenantId,
          userId,
          resourceTenantId: tenantId, // same tenant
        });
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('TENANT scope should deny access when resource belongs to different tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        resourceArb,
        actionArb,
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (resource, action, tenantId, userId, otherTenantId) => {
          fc.pre(tenantId !== otherTenantId);
          const permissions = [makePermission(resource, action, PermissionScope.TENANT)];
          const result = evaluator.evaluate(permissions, resource, action, {
            tenantId,
            userId,
            resourceTenantId: otherTenantId,
          });
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('OWN scope should grant access when userId matches resourceOwnerId', async () => {
    await fc.assert(
      fc.asyncProperty(resourceArb, actionArb, fc.uuid(), fc.uuid(), async (resource, action, tenantId, userId) => {
        const permissions = [makePermission(resource, action, PermissionScope.OWN)];
        const result = evaluator.evaluate(permissions, resource, action, {
          tenantId,
          userId,
          resourceOwnerId: userId, // same user
        });
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('OWN scope should deny access when userId does not match resourceOwnerId', async () => {
    await fc.assert(
      fc.asyncProperty(
        resourceArb,
        actionArb,
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (resource, action, tenantId, userId, otherUserId) => {
          fc.pre(userId !== otherUserId);
          const permissions = [makePermission(resource, action, PermissionScope.OWN)];
          const result = evaluator.evaluate(permissions, resource, action, {
            tenantId,
            userId,
            resourceOwnerId: otherUserId,
          });
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should deny access when no permissions match resource and action', async () => {
    await fc.assert(
      fc.asyncProperty(
        resourceArb,
        actionArb,
        actionArb,
        scopeArb,
        fc.uuid(),
        fc.uuid(),
        async (resource, requiredAction, otherAction, scope, tenantId, userId) => {
          fc.pre(requiredAction !== otherAction);
          // Permission exists but for a different action
          const permissions = [makePermission(resource, otherAction, scope)];
          const result = evaluator.evaluate(permissions, resource, requiredAction, { tenantId, userId });
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should deny access when permissions array is empty', async () => {
    await fc.assert(
      fc.asyncProperty(resourceArb, actionArb, fc.uuid(), fc.uuid(), async (resource, action, tenantId, userId) => {
        const result = evaluator.evaluate([], resource, action, { tenantId, userId });
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
