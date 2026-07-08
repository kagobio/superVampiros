/**
 * Datos semilla iniciales. Son solo ejemplos: el usuario puede crear, editar,
 * eliminar y reordenar todo. Se insertan una única vez (ver Settings.seeded).
 */

export interface SeedCategory {
  name: string;
  icon: string;
  color: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { name: 'Nevera', icon: 'refrigerator', color: '#3B82C4' },
  { name: 'Congelador', icon: 'snowflake', color: '#5AA9E6' },
  { name: 'Despensa', icon: 'archive', color: '#E0932F' },
  { name: 'Bebidas', icon: 'cup-soda', color: '#8B5CF6' },
  { name: 'Limpieza', icon: 'spray-can', color: '#3FB27F' },
  { name: 'Baño', icon: 'bath', color: '#A7A0AA' },
  { name: 'Mascotas', icon: 'paw-print', color: '#B0121B' },
];

export interface SeedLocation {
  name: string;
  icon: string;
  color: string;
}

export const SEED_LOCATIONS: SeedLocation[] = [
  { name: 'Nevera', icon: 'refrigerator', color: '#3B82C4' },
  { name: 'Congelador', icon: 'snowflake', color: '#5AA9E6' },
  { name: 'Armario cocina', icon: 'archive', color: '#E0932F' },
  { name: 'Despensa', icon: 'door-closed', color: '#7A1420' },
];

export interface SeedUnit {
  name: string;
  abbreviation: string;
}

export const SEED_UNITS: SeedUnit[] = [
  { name: 'unidades', abbreviation: 'ud' },
  { name: 'kilogramos', abbreviation: 'kg' },
  { name: 'gramos', abbreviation: 'g' },
  { name: 'litros', abbreviation: 'L' },
  { name: 'mililitros', abbreviation: 'ml' },
  { name: 'paquetes', abbreviation: 'paq' },
  { name: 'cajas', abbreviation: 'caja' },
  { name: 'latas', abbreviation: 'lata' },
  { name: 'botes', abbreviation: 'bote' },
  { name: 'botellas', abbreviation: 'bot' },
];
