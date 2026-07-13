/** Redondea un importe a 2 decimales (céntimos). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** Formatea un importe en euros (es-ES), p. ej. `1,20 €`. */
export function formatEur(n: number): string {
  return eur.format(n);
}
