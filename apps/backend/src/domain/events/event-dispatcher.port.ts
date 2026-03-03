import { DomainEvent } from './domain-event';

export interface IEventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export interface IEventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  register(eventType: string, handler: IEventHandler): void;
}
