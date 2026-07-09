import type { BackupFile } from '@/domain/backup/backup.types';

/**
 * Contrato de copias de seguridad automáticas. Hoy no se implementa (ver
 * `features.sync` / futuro): la idea es que un adaptador guarde periódicamente
 * el `BackupFile` en un destino (archivo local programado, nube del hogar, etc.).
 *
 * Dejarlo como interfaz permite añadir backups automáticos sin tocar la UI ni
 * el resto de servicios: bastará con implementar `save` y programar su llamada.
 */
export interface BackupAdapter {
  save(backup: BackupFile): Promise<void>;
  latest(): Promise<BackupFile | null>;
}

/** Adaptador nulo por defecto (backups automáticos desactivados). */
export const noopBackupAdapter: BackupAdapter = {
  async save() {
    /* no-op */
  },
  async latest() {
    return null;
  },
};
