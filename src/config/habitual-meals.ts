/**
 * Comidas habituales de la casa. Son las que se comen normalmente y sirven de
 * base para marcar favoritas de un toque, que luego la IA prioriza al generar
 * el menú y que se colocan rápido en la semana.
 *
 * Cada una se guarda como receta: los ingredientes se emparejan con el
 * inventario (los que existan quedan enlazados para la lista de la compra) y los
 * pasos / ingredientes que falten se anotan en las notas. Cada ingrediente lleva
 * su cantidad (en la unidad del producto del inventario con el que se empareja),
 * pensada para las raciones indicadas en `servings`. Así la lista de la compra
 * sale ajustada en vez de "1 de cada"; el usuario puede afinarla luego desde
 * Recetas.
 */
export interface HabitualMealIngredient {
  name: string;
  /** Cantidad para las raciones de la comida (en la unidad del producto). */
  quantity: number;
}

export interface HabitualMeal {
  name: string;
  /** Raciones para las que están pensadas las cantidades. */
  servings: number;
  ingredients: HabitualMealIngredient[];
  steps: string[];
}

export const HABITUAL_MEALS: HabitualMeal[] = [
  {
    name: 'Poke',
    servings: 2,
    ingredients: [
      { name: 'Arroz', quantity: 2 },
      { name: 'Salmón', quantity: 2 },
      { name: 'Aguacate', quantity: 1 },
      { name: 'Edamame', quantity: 1 },
      { name: 'Pepino', quantity: 1 },
      { name: 'Zanahoria', quantity: 1 },
      { name: 'Salsa de soja', quantity: 1 },
      { name: 'Sésamo', quantity: 1 },
    ],
    steps: [
      'Cuece el arroz y déjalo templar.',
      'Corta el salmón, el aguacate y las verduras en dados.',
      'Monta el bol sobre el arroz y aliña con soja y sésamo.',
    ],
  },
  {
    name: 'Arroz con carne picada, cottage y aguacate',
    servings: 2,
    ingredients: [
      { name: 'Arroz', quantity: 2 },
      { name: 'Carne picada', quantity: 1 },
      { name: 'Queso cottage', quantity: 1 },
      { name: 'Aguacate', quantity: 1 },
    ],
    steps: [
      'Cuece el arroz.',
      'Saltea la carne picada hasta dorarla.',
      'Sirve el arroz con la carne, el cottage y el aguacate en dados.',
    ],
  },
  {
    name: 'Lentejas',
    servings: 4,
    ingredients: [
      { name: 'Lentejas', quantity: 2 },
      { name: 'Cebolla', quantity: 1 },
      { name: 'Zanahoria', quantity: 2 },
      { name: 'Pimiento', quantity: 1 },
      { name: 'Chorizo', quantity: 1 },
      { name: 'Ajo', quantity: 2 },
      { name: 'Laurel', quantity: 1 },
    ],
    steps: [
      'Pocha la cebolla, el ajo, el pimiento y la zanahoria.',
      'Añade las lentejas, el chorizo y el laurel y cubre con agua.',
      'Cuece a fuego lento hasta que estén tiernas.',
    ],
  },
  {
    name: 'Carne con verduras y patatas',
    servings: 2,
    ingredients: [
      { name: 'Carne', quantity: 2 },
      { name: 'Patatas', quantity: 3 },
      { name: 'Verduras variadas', quantity: 2 },
      { name: 'Cebolla', quantity: 1 },
      { name: 'Ajo', quantity: 2 },
    ],
    steps: [
      'Dora la carne con la cebolla y el ajo.',
      'Añade las verduras y las patatas en trozos.',
      'Cocina a fuego medio hasta que las patatas estén hechas.',
    ],
  },
  {
    name: 'Pasta con cosas',
    servings: 2,
    ingredients: [
      { name: 'Pasta', quantity: 2 },
      { name: 'Tomate', quantity: 2 },
      { name: 'Cebolla', quantity: 1 },
      { name: 'Ajo', quantity: 2 },
      { name: 'Queso', quantity: 1 },
    ],
    steps: [
      'Cuece la pasta al dente.',
      'Prepara una salsa con lo que tengas (tomate, verduras, carne…).',
      'Mezcla la pasta con la salsa y añade queso.',
    ],
  },
  {
    name: 'Ensalada David',
    servings: 2,
    ingredients: [
      { name: 'Lechuga', quantity: 1 },
      { name: 'Tomate', quantity: 2 },
      { name: 'Atún', quantity: 2 },
      { name: 'Huevo', quantity: 2 },
      { name: 'Maíz', quantity: 1 },
      { name: 'Aceitunas', quantity: 1 },
      { name: 'Cebolla', quantity: 1 },
    ],
    steps: [
      'Trocea la lechuga, el tomate y la cebolla.',
      'Añade el atún, el huevo cocido, el maíz y las aceitunas.',
      'Aliña al gusto.',
    ],
  },
  {
    name: 'Berenjenas rellenas',
    servings: 2,
    ingredients: [
      { name: 'Berenjena', quantity: 2 },
      { name: 'Carne picada', quantity: 1 },
      { name: 'Cebolla', quantity: 1 },
      { name: 'Tomate', quantity: 1 },
      { name: 'Queso rallado', quantity: 1 },
      { name: 'Ajo', quantity: 2 },
    ],
    steps: [
      'Hornea las berenjenas y vacía la pulpa.',
      'Saltea la carne con cebolla, ajo, tomate y la pulpa.',
      'Rellena, cubre con queso y gratina.',
    ],
  },
  {
    name: 'Hamburguesa con patatas fritas',
    servings: 2,
    ingredients: [
      { name: 'Pan de hamburguesa', quantity: 2 },
      { name: 'Carne de hamburguesa', quantity: 2 },
      { name: 'Queso', quantity: 2 },
      { name: 'Lechuga', quantity: 1 },
      { name: 'Tomate', quantity: 1 },
      { name: 'Patatas', quantity: 3 },
    ],
    steps: [
      'Haz la carne a la plancha y funde el queso encima.',
      'Monta la hamburguesa con lechuga y tomate en el pan.',
      'Acompaña con patatas fritas.',
    ],
  },
];
