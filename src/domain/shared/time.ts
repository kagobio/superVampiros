/** Marca temporal en milisegundos desde epoch. */
export type Timestamp = number;

/** Reloj inyectable: facilita tests deterministas y una futura fuente de tiempo sincronizada. */
export interface Clock {
  now(): Timestamp;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};
