import type { HistoryEvent } from '@/domain/history/history.types';

/**
 * Contrato de sincronización. Hoy no se implementa (ver `features.sync`).
 *
 * Diseño previsto: el historial actúa como log de operaciones (outbox). Un
 * adaptador remoto hará `push` de los eventos locales pendientes y `pull` de
 * los remotos desde un cursor. La resolución de conflictos será last-write-wins
 * por `updatedAt`/`revision`, con tombstones (`deletedAt`) para los borrados.
 *
 * Activar la sync en el futuro = implementar esta interfaz + introducir una
 * `householdKey` en Ajustes. No requiere tocar dominio ni UI.
 */
export interface SyncAdapter {
  /** Envía los eventos locales pendientes al servidor remoto. */
  push(events: HistoryEvent[]): Promise<void>;
  /** Obtiene los eventos remotos ocurridos desde `sinceTimestamp`. */
  pull(sinceTimestamp: number): Promise<HistoryEvent[]>;
}

/** Adaptador nulo por defecto: no hace nada mientras la sync está desactivada. */
export const noopSyncAdapter: SyncAdapter = {
  async push() {
    /* no-op */
  },
  async pull() {
    return [];
  },
};
