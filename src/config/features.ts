/**
 * Feature flags. Permiten dejar preparada la arquitectura para módulos futuros
 * y activarlos sin refactor. Todo lo que hoy está en `false` tiene su capa de
 * abstracción lista (interfaces/stubs) pero no su implementación.
 */
export const features = {
  sync: false,
  barcodeScanner: false,
  ocrReceipts: false,
  aiRecipes: false,
  aiShoppingList: false,
  spendingTracker: false,
  mealPlanner: false,
  notifications: false,
  publicApi: false,
} as const;

export type FeatureName = keyof typeof features;

export function isEnabled(feature: FeatureName): boolean {
  return features[feature];
}
