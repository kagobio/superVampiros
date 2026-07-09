/**
 * Fachada de sincronización con carga perezosa: el SDK de Firebase (pesado) solo
 * se descarga cuando el usuario activa la sync, no en el arranque normal.
 */

export async function connectSync(householdKey: string): Promise<void> {
  const engine = await import('./sync-engine');
  return engine.connectSync(householdKey);
}

export async function disconnectSync(): Promise<void> {
  const engine = await import('./sync-engine');
  return engine.disconnectSync();
}
