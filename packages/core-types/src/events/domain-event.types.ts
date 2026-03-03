export interface DomainEventPayload {
  eventId: string;
  eventType: string;
  occurredAt: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export interface UserCreatedPayload extends DomainEventPayload {
  eventType: 'user.created';
  payload: {
    userId: string;
    tenantId: string;
    email: string;
  };
}

export interface RoleAssignedPayload extends DomainEventPayload {
  eventType: 'role.assigned';
  payload: {
    userId: string;
    roleId: string;
    tenantId: string;
  };
}

export interface ModuleToggledPayload extends DomainEventPayload {
  eventType: 'module.toggled';
  payload: {
    moduleId: string;
    tenantId: string;
    isActive: boolean;
  };
}
