import { DomainEvent } from './domain-event';

export class ModuleToggledEvent extends DomainEvent {
  readonly eventType = 'module.toggled';

  constructor(
    readonly aggregateId: string,
    readonly payload: { moduleId: string; tenantId: string; isActive: boolean },
  ) {
    super();
  }
}
