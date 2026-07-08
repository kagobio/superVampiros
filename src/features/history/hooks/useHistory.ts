import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/persistence/db';
import type { HistoryEvent } from '@/domain/history/history.types';

/** Eventos del historial más recientes primero (reactivo). */
export function useHistory(limit = 300): HistoryEvent[] {
  return useLiveQuery(
    () => db.history.orderBy('timestamp').reverse().limit(limit).toArray(),
    [limit],
    [],
  );
}
