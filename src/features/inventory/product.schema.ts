import { z } from 'zod';

/**
 * Schema de validación del formulario de producto. Es la fuente de verdad de
 * validación (PROJECT_RULES §10) y se reutilizará en import/export.
 *
 * Los `id` se manejan como cadena (`''` = ninguno) para encajar con los `<select>`
 * nativos; el servicio los convierte a `null`. La caducidad es `YYYY-MM-DD`.
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
  categoryId: z.string(),
  locationId: z.string(),
  quantity: z
    .number({ message: 'Introduce un número' })
    .min(0, 'No puede ser negativa')
    .max(999_999),
  unitId: z.string(),
  minStock: z
    .number({ message: 'Introduce un número' })
    .min(0, 'No puede ser negativo')
    .max(999_999),
  favorite: z.boolean(),
  expiryDate: z.string(),
  notes: z.string().max(1000, 'Máximo 1000 caracteres'),
  icon: z.string(),
  color: z.string(),
  tagIds: z.array(z.string()),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
