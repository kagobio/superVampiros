import { db } from '@/persistence/db';
import { inventoryService } from '@/services/inventory/inventory.service';
import { systemClock } from '@/domain/shared/time';

interface DemoProduct {
  name: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  minStock: number;
  favorite?: boolean;
  /** Días hasta la caducidad (null = sin fecha). */
  expiresInDays: number | null;
  icon: string;
  color: string;
  price: number | null;
}

/** Productos de muestra realistas: algo de stock, caducidades variadas y un agotado. */
const DEMO_PRODUCTS: DemoProduct[] = [
  { name: 'Leche entera', category: 'Nevera', location: 'Nevera', quantity: 2, unit: 'litros', minStock: 1, favorite: true, expiresInDays: 3, icon: '🥛', color: '#3B82C4', price: 0.95 },
  { name: 'Huevos camperos', category: 'Nevera', location: 'Nevera', quantity: 12, unit: 'unidades', minStock: 6, expiresInDays: 10, icon: '🥚', color: '#E0932F', price: 2.8 },
  { name: 'Pechuga de pollo', category: 'Nevera', location: 'Congelador', quantity: 1, unit: 'kilogramos', minStock: 0, expiresInDays: 2, icon: '🍗', color: '#C4503B', price: 6.4 },
  { name: 'Yogur natural', category: 'Nevera', location: 'Nevera', quantity: 4, unit: 'unidades', minStock: 2, expiresInDays: 1, icon: '🥣', color: '#7A9E7E', price: 1.6 },
  { name: 'Queso curado', category: 'Nevera', location: 'Nevera', quantity: 250, unit: 'gramos', minStock: 0, expiresInDays: 30, icon: '🧀', color: '#D9B036', price: 4.2 },
  { name: 'Tomate frito', category: 'Despensa', location: 'Armario cocina', quantity: 3, unit: 'botes', minStock: 2, expiresInDays: 400, icon: '🍅', color: '#C4503B', price: 1.1 },
  { name: 'Pasta espagueti', category: 'Despensa', location: 'Despensa', quantity: 5, unit: 'paquetes', minStock: 2, expiresInDays: 700, icon: '🍝', color: '#E0932F', price: 0.9 },
  { name: 'Café molido', category: 'Despensa', location: 'Armario cocina', quantity: 1, unit: 'paquetes', minStock: 1, favorite: true, expiresInDays: 180, icon: '☕', color: '#6B4A2F', price: 3.5 },
  { name: 'Atún en lata', category: 'Despensa', location: 'Despensa', quantity: 0, unit: 'latas', minStock: 3, expiresInDays: 900, icon: '🥫', color: '#A7A0AA', price: 1.3 },
];

const DAY_MS = 86_400_000;

/**
 * Carga productos de ejemplo para ver la app con contenido. No hace nada si ya
 * hay productos, para no duplicar ni mezclar con datos reales. Devuelve cuántos
 * productos ha creado. Pasa por el servicio de inventario, así cada alta queda
 * registrada en el historial como cualquier producto creado a mano.
 */
export async function loadDemoData(): Promise<number> {
  const existing = await db.products.count();
  if (existing > 0) return 0;

  const [categories, locations, units] = await Promise.all([
    db.categories.toArray(),
    db.locations.toArray(),
    db.units.toArray(),
  ]);
  const catId = (name: string) => categories.find((c) => c.name === name)?.id ?? null;
  const locId = (name: string) => locations.find((l) => l.name === name)?.id ?? null;
  const unitId = (name: string) => units.find((u) => u.name === name)?.id ?? null;

  const now = systemClock.now();
  let created = 0;
  for (const item of DEMO_PRODUCTS) {
    await inventoryService.create({
      name: item.name,
      categoryId: catId(item.category),
      locationId: locId(item.location),
      quantity: item.quantity,
      unitId: unitId(item.unit),
      minStock: item.minStock,
      favorite: item.favorite ?? false,
      expiryDate: item.expiresInDays == null ? null : now + item.expiresInDays * DAY_MS,
      icon: item.icon,
      color: item.color,
      price: item.price,
    });
    created += 1;
  }
  return created;
}
