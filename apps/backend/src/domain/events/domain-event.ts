import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  abstract readonly eventType: string;
  abstract readonly aggregateId: string;
  abstract readonly payload: Record<string, unknown>;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      payload: this.payload,
    };
  }

  static fromJSON(json: Record<string, unknown>): {
    eventId: string;
    eventType: string;
    occurredAt: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  } {
    return {
      eventId: json.eventId as string,
      eventType: json.eventType as string,
      occurredAt: json.occurredAt as string,
      aggregateId: json.aggregateId as string,
      payload: json.payload as Record<string, unknown>,
    };
  }
}
