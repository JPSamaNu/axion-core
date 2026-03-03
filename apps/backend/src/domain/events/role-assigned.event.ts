import { DomainEvent } from './domain-event';

export class RoleAssignedEvent extends DomainEvent {
  readonly eventType = 'role.assigned';

  constructor(
    readonly aggregateId: string,
    readonly payload: { userId: string; roleId: string; tenantId: string },
  ) {
    super();
  }
}
