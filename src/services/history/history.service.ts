import { db } from '@/persistence/db';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import type { EntityType, HistoryEvent, HistoryEventType } from '@/domain/history/history.types';

/**
 * Registra eventos en el historial. Esta tabla es append-only y hace de log de
 * operaciones (outbox) para la sincronización futura: todo cambio de dominio
 * debe pasar por aquí para quedar registrado y ser reproducible.
 */
export class HistoryService {
  private readonly clock: Clock;

  constructor(clock: Clock = systemClock) {
    this.clock = clock;
  }

  async record(
    type: HistoryEventType,
    entityType: EntityType,
    entityId: string,
    payload: Record<string, unknown> = {},
  ): Promise<HistoryEvent> {
    const now = this.clock.now();
    const event: HistoryEvent = {
      ...baseEntity(newId(), now),
      type,
      entityType,
      entityId,
      payload,
      timestamp: now,
    };
    await db.history.add(event);
    return event;
  }

  /** Eventos más recientes primero. */
  async recent(limit = 100): Promise<HistoryEvent[]> {
    return db.history.orderBy('timestamp').reverse().limit(limit).toArray();
  }
}

export const historyService = new HistoryService();
