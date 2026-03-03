import { DomainEvent } from './domain-event';

export class UserCreatedEvent extends DomainEvent {
  readonly eventType = 'user.created';

  constructor(
    readonly aggregateId: string,
    readonly payload: { userId: string; tenantId: string; email: string },
  ) {
    super();
  }
}
