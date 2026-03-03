import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  EventSubscriber,
} from 'typeorm';
import { UserOrmEntity } from '../entities/user.entity';

/**
 * Subscriber centralizado de auditoría.
 * Registra automáticamente createdAt/updatedAt/createdBy/updatedBy
 * en entidades que tengan esos campos.
 *
 * Nota: createdBy y updatedBy se inyectan desde el contexto de la petición
 * a través del repositorio antes de llamar a save(). Este subscriber
 * se asegura de que las fechas se actualicen correctamente.
 */
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): void {
    const entity = event.entity;
    if (!entity) return;

    const now = new Date();
    if ('createdAt' in entity && !entity.createdAt) {
      entity.createdAt = now;
    }
    if ('updatedAt' in entity) {
      entity.updatedAt = now;
    }
  }

  beforeUpdate(event: UpdateEvent<any>): void {
    const entity = event.entity;
    if (!entity) return;

    if ('updatedAt' in entity) {
      entity.updatedAt = new Date();
    }
  }
}
