/** Utilidades de fecha para el input `type=date` (cadena `YYYY-MM-DD`). */

/** Convierte un timestamp a `YYYY-MM-DD` (hora local), o '' si es nulo. */
export function toDateInput(timestamp: number | null): string {
  if (timestamp == null) return '';
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Convierte una cadena `YYYY-MM-DD` a timestamp (medianoche local), o null. */
export function fromDateInput(value: string): number | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
}

/** Tiempo relativo legible en español ("hace 5 min", "ayer", fecha corta). */
export function formatRelativeTime(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Texto legible del estado de caducidad a partir de días de calendario restantes. */
export function describeExpiry(days: number): string {
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? 'Caducó ayer' : `Caducó hace ${n} días`;
  }
  if (days === 0) return 'Caduca hoy';
  if (days === 1) return 'Caduca mañana';
  return `Caduca en ${days} días`;
}
