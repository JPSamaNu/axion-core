import * as fc from 'fast-check';
import { UserCreatedEvent } from '../user-created.event';
import { RoleAssignedEvent } from '../role-assigned.event';
import { ModuleToggledEvent } from '../module-toggled.event';
import { DomainEvent } from '../domain-event';

/**
 * Feature: saas-multi-tenant-core, Property 12: Serialización round-trip de Domain Events
 * **Valida: Requisito 6.7**
 *
 * Para cualquier Domain Event válido, serializarlo a JSON con toJSON() y luego
 * reconstruirlo desde ese JSON debe producir un evento equivalente.
 */
describe('Property 12: Serialización round-trip de Domain Events', () => {
  it('UserCreatedEvent round-trip serialization', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.emailAddress(), async (aggregateId, tenantId, email) => {
        const event = new UserCreatedEvent(aggregateId, {
          userId: aggregateId,
          tenantId,
          email,
        });

        const json = event.toJSON();
        const parsed = DomainEvent.fromJSON(json);

        expect(parsed.eventId).toBe(event.eventId);
        expect(parsed.eventType).toBe('user.created');
        expect(parsed.occurredAt).toBe(event.occurredAt.toISOString());
        expect(parsed.aggregateId).toBe(aggregateId);
        expect(parsed.payload).toEqual({ userId: aggregateId, tenantId, email });
      }),
      { numRuns: 100 },
    );
  });

  it('RoleAssignedEvent round-trip serialization', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.uuid(), async (aggregateId, roleId, tenantId) => {
        const event = new RoleAssignedEvent(aggregateId, {
          userId: aggregateId,
          roleId,
          tenantId,
        });

        const json = event.toJSON();
        const parsed = DomainEvent.fromJSON(json);

        expect(parsed.eventId).toBe(event.eventId);
        expect(parsed.eventType).toBe('role.assigned');
        expect(parsed.aggregateId).toBe(aggregateId);
        expect(parsed.payload).toEqual({ userId: aggregateId, roleId, tenantId });
      }),
      { numRuns: 100 },
    );
  });

  it('ModuleToggledEvent round-trip serialization', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.boolean(), async (moduleId, tenantId, isActive) => {
        const event = new ModuleToggledEvent(moduleId, {
          moduleId,
          tenantId,
          isActive,
        });

        const json = event.toJSON();
        const parsed = DomainEvent.fromJSON(json);

        expect(parsed.eventId).toBe(event.eventId);
        expect(parsed.eventType).toBe('module.toggled');
        expect(parsed.aggregateId).toBe(moduleId);
        expect(parsed.payload).toEqual({ moduleId, tenantId, isActive });
      }),
      { numRuns: 100 },
    );
  });
});
