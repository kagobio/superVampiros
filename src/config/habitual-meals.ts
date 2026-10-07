/**
 * Comidas habituales de la casa. Son las que se comen normalmente y sirven de
 * base para marcar favoritas de un toque, que luego la IA prioriza al generar
 * el menú y que se colocan rápido en la semana.
 *
 * Cada una se guarda como receta: los ingredientes se emparejan con el
 * inventario (los que existan quedan enlazados para la lista de la compra) y los
 * pasos / ingredientes que falten se anotan en las notas. Las cantidades no se
 * especifican aquí (cada ingrediente cuenta como 1); el usuario puede afinarlas
 * luego desde Recetas.
 */
export interface HabitualMeal {
  name: string;
  ingredients: string[];
  steps: string[];
}

export const HABITUAL_MEALS: HabitualMeal[] = [
  {
    name: 'Poke',
    ingredients: [
      'Arroz',
      'Salmón',
      'Aguacate',
      'Edamame',
      'Pepino',
      'Zanahoria',
      'Salsa de soja',
      'Sésamo',
    ],
    steps: [
      'Cuece el arroz y déjalo templar.',
      'Corta el salmón, el aguacate y las verduras en dados.',
      'Monta el bol sobre el arroz y aliña con soja y sésamo.',
    ],
  },
  {
    name: 'Arroz con carne picada, cottage y aguacate',
    ingredients: ['Arroz', 'Carne picada', 'Queso cottage', 'Aguacate'],
    steps: [
      'Cuece el arroz.',
      'Saltea la carne picada hasta dorarla.',
      'Sirve el arroz con la carne, el cottage y el aguacate en dados.',
    ],
  },
  {
    name: 'Lentejas',
    ingredients: ['Lentejas', 'Cebolla', 'Zanahoria', 'Pimiento', 'Chorizo', 'Ajo', 'Laurel'],
    steps: [
      'Pocha la cebolla, el ajo, el pimiento y la zanahoria.',
      'Añade las lentejas, el chorizo y el laurel y cubre con agua.',
      'Cuece a fuego lento hasta que estén tiernas.',
    ],
  },
  {
    name: 'Carne con verduras y patatas',
    ingredients: ['Carne', 'Patatas', 'Verduras variadas', 'Cebolla', 'Ajo'],
    steps: [
      'Dora la carne con la cebolla y el ajo.',
      'Añade las verduras y las patatas en trozos.',
      'Cocina a fuego medio hasta que las patatas estén hechas.',
    ],
  },
  {
    name: 'Pasta con cosas',
    ingredients: ['Pasta', 'Tomate', 'Cebolla', 'Ajo', 'Queso'],
    steps: [
      'Cuece la pasta al dente.',
      'Prepara una salsa con lo que tengas (tomate, verduras, carne…).',
      'Mezcla la pasta con la salsa y añade queso.',
    ],
  },
  {
    name: 'Ensalada David',
    ingredients: ['Lechuga', 'Tomate', 'Atún', 'Huevo', 'Maíz', 'Aceitunas', 'Cebolla'],
    steps: [
      'Trocea la lechuga, el tomate y la cebolla.',
      'Añade el atún, el huevo cocido, el maíz y las aceitunas.',
      'Aliña al gusto.',
    ],
  },
  {
    name: 'Berenjenas rellenas',
    ingredients: ['Berenjena', 'Carne picada', 'Cebolla', 'Tomate', 'Queso rallado', 'Ajo'],
    steps: [
      'Hornea las berenjenas y vacía la pulpa.',
      'Saltea la carne con cebolla, ajo, tomate y la pulpa.',
      'Rellena, cubre con queso y gratina.',
    ],
  },
  {
    name: 'Hamburguesa con patatas fritas',
    ingredients: [
      'Pan de hamburguesa',
      'Carne de hamburguesa',
      'Queso',
      'Lechuga',
      'Tomate',
      'Patatas',
    ],
    steps: [
      'Haz la carne a la plancha y funde el queso encima.',
      'Monta la hamburguesa con lechuga y tomate en el pan.',
      'Acompaña con patatas fritas.',
    ],
  },
];
