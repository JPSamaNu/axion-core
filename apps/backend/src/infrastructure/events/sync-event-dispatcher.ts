import { Injectable, Logger } from '@nestjs/common';
import { IEventDispatcher, IEventHandler } from '@domain/events';
import { DomainEvent } from '@domain/events';

@Injectable()
export class SyncEventDispatcher implements IEventDispatcher {
  private readonly logger = new Logger(SyncEventDispatcher.name);
  private readonly handlers = new Map<string, IEventHandler[]>();

  async dispatch(event: DomainEvent): Promise<void> {
    this.logger.log(`Dispatching event: ${event.eventType} [${event.eventId}]`);

    const handlers = this.handlers.get(event.eventType) ?? [];

    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        this.logger.error(
          `Error handling event ${event.eventType}: ${error}`,
        );
      }
    }
  }

  register(eventType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }
}
