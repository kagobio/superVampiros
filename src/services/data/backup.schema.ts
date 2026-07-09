import { z } from 'zod';
import { BACKUP_APP } from '@/domain/backup/backup.types';

/**
 * Validación del fichero de backup al importar. Comprobamos el sobre y que cada
 * tabla sea un array de registros con `id` de tipo string (defensa suficiente
 * contra ficheros corruptos, sin duplicar todo el modelo en Zod).
 *
 * Nota: solo se usa para VALIDAR la forma; la fusión se hace desde el JSON crudo
 * (el parse de objetos de Zod descarta claves desconocidas), así no se pierden
 * campos de las entidades.
 */
const entityArray = z.array(z.object({ id: z.string() }));

export const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.number(),
  exportedAt: z.number(),
  data: z.object({
    products: entityArray,
    categories: entityArray,
    locations: entityArray,
    units: entityArray,
    tags: entityArray,
    shoppingItems: entityArray,
    recipes: entityArray,
    packs: entityArray,
    history: entityArray,
    settings: z.object({ id: z.string() }).nullable(),
  }),
});
