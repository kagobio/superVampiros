import type { Product } from '@/domain/product/product.types';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';
import type { Unit } from '@/domain/unit/unit.types';
import type { Tag } from '@/domain/tag/tag.types';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import type { Pack } from '@/domain/pack/pack.types';
import type { HistoryEvent } from '@/domain/history/history.types';
import type { Settings } from '@/domain/settings/settings.types';

export const BACKUP_APP = 'alimentos-vampiricos';
export const BACKUP_VERSION = 1;

/** Conjunto completo de datos de un hogar. */
export interface BackupData {
  products: Product[];
  categories: Category[];
  locations: Location[];
  units: Unit[];
  tags: Tag[];
  shoppingItems: ShoppingListItem[];
  recipes: Recipe[];
  packs: Pack[];
  history: HistoryEvent[];
  settings: Settings | null;
}

/** Fichero de copia de seguridad exportable/importable (JSON). */
export interface BackupFile {
  app: string;
  version: number;
  exportedAt: number;
  data: BackupData;
}
