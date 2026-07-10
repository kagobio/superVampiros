/**
 * Adivina un emoji apropiado a partir del nombre del producto. Heurística por
 * palabras clave (sin acentos, minúsculas). Devuelve '' si no hay coincidencia,
 * para que el avatar use su icono de reserva.
 *
 * Las palabras cortas y ambiguas se acotan con espacios (` pan `) para no casar
 * dentro de otras (`panceta`). El orden importa: gana la primera que coincide,
 * por eso los casos específicos van antes que los genéricos.
 */

const RULES: Array<[string[], string]> = [
  // Lácteos y huevos
  [['leche condensada'], '🥛'],
  [['leche'], '🥛'],
  [['batido'], '🥤'],
  [['nata', 'crema de leche'], '🥛'],
  [['yogur', 'yogourt'], '🍶'],
  [['queso'], '🧀'],
  [['mantequilla'], '🧈'],
  [['margarina'], '🧈'],
  [['huevo'], '🥚'],
  // Panadería y cereales
  [[' pan ', 'panecillo', 'baguette', 'chapata', 'molde', 'tostada', 'biscote'], '🍞'],
  [['croissant', 'napolitana', 'bolleria'], '🥐'],
  [['cereal', 'muesli', 'avena', 'copos'], '🥣'],
  [['harina'], '🌾'],
  [['galleta'], '🍪'],
  [['magdalena', 'bizcocho', 'muffin', 'madalena'], '🧁'],
  // Despensa / básicos
  [['arroz'], '🍚'],
  [['pasta', 'espagueti', 'macarron', 'fideo', 'tallarin', 'noodle'], '🍝'],
  [['lenteja', 'garbanzo', 'alubia', 'judia', 'frijol', 'legumbre'], '🫘'],
  [['aceite', 'oliva'], '🫒'],
  [['vinagre'], '🧴'],
  [[' sal ', 'salero'], '🧂'],
  [['azucar'], '🍬'],
  [['miel'], '🍯'],
  [['caldo', 'sopa'], '🍜'],
  [['tomate frito', 'salsa', 'ketchup', 'mayonesa', 'mostaza', 'pesto'], '🥫'],
  [['conserva', ' lata'], '🥫'],
  [['cacao', 'chocolate', 'nocilla', 'crema de cacao'], '🍫'],
  [['mermelada', 'confitura'], '🍓'],
  // Carnes y embutidos
  [['pollo'], '🍗'],
  [['pavo'], '🦃'],
  [['carne', 'ternera', 'cerdo', 'filete', 'lomo', 'cordero', 'conejo'], '🥩'],
  [['hamburguesa', 'burger'], '🍔'],
  [['salchicha', 'frankfurt'], '🌭'],
  [['bacon', 'panceta', 'jamon', 'chorizo', 'salchichon', 'embutido', 'fuet', 'york'], '🥓'],
  // Pescado y marisco
  [['pescado', 'atun', 'merluza', 'salmon', 'sardina', 'bacalao', 'lubina', 'dorada'], '🐟'],
  [['gamba', 'langostino', 'marisco', 'mejillon', 'almeja', 'calamar', 'pulpo'], '🦐'],
  // Frutas
  [['manzana'], '🍎'],
  [['platano', 'banana'], '🍌'],
  [['naranja', 'mandarina', 'clementina'], '🍊'],
  [['limon', 'lima'], '🍋'],
  [['pera'], '🍐'],
  [['fresa', 'freson'], '🍓'],
  [['uva'], '🍇'],
  [['sandia'], '🍉'],
  [['melon'], '🍈'],
  [['melocoton', 'nectarina', 'paraguayo'], '🍑'],
  [['cereza'], '🍒'],
  // ` pina` (con espacio delante) evita casar dentro de `espinaca`.
  [[' pina', 'ananas'], '🍍'],
  [['kiwi'], '🥝'],
  [['coco'], '🥥'],
  [['aguacate'], '🥑'],
  [['fruto seco', 'nuez', 'nueces', 'almendra', 'cacahuete', 'pistacho', 'anacardo'], '🥜'],
  // Verduras y hortalizas
  [['patata', 'papa'], '🥔'],
  [['cebolla'], '🧅'],
  [['ajo'], '🧄'],
  [['zanahoria'], '🥕'],
  [['tomate'], '🍅'],
  [['lechuga', 'ensalada', 'espinaca', 'acelga', 'canonigo', 'rucula', 'col ', 'repollo'], '🥬'],
  [['brocoli', 'brecol'], '🥦'],
  [['pimiento'], '🫑'],
  [['pepino'], '🥒'],
  [['berenjena'], '🍆'],
  [['maiz'], '🌽'],
  [['champinon', 'seta', 'hongo'], '🍄'],
  [['calabacin', 'calabaza'], '🎃'],
  [['brote', 'germinado'], '🌱'],
  // Bebidas
  [['agua'], '💧'],
  [['cafe'], '☕'],
  [[' te ', 'infusion', 'manzanilla', 'poleo'], '🍵'],
  [['cerveza'], '🍺'],
  [['vino', 'tinto', 'blanco', 'rosado'], '🍷'],
  [['refresco', ' cola', 'gaseosa', 'tonica', 'zumo', 'jugo', 'nestea'], '🥤'],
  // Dulces y snacks
  [['helado', 'polo'], '🍦'],
  [['flan', 'natilla', 'pudin'], '🍮'],
  [['tarta', 'pastel'], '🍰'],
  [['caramelo', 'chuche', 'gominola'], '🍬'],
  [['patatas fritas', 'chips', 'aperitivo', 'snack', 'nacho', 'dorito'], '🍟'],
  [['palomita'], '🍿'],
  [['pizza'], '🍕'],
  [['aceituna', 'encurtido'], '🫒'],
  // Bebé, higiene, limpieza, hogar, mascotas
  [['papel', 'servilleta', 'higienico'], '🧻'],
  [['jabon', 'gel', 'champu', 'detergente', 'limpieza', 'suavizante', 'lejia', 'limpiador'], '🧼'],
  [['pasta de dientes', 'dentifrico', 'cepillo'], '🪥'],
  [['pañal', 'panal', 'toallita'], '🍼'],
  [['pila', 'bateria'], '🔋'],
  [['bombilla'], '💡'],
  [['perro', 'gato', 'mascota', 'pienso'], '🐾'],
];

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')} `;
}

export function guessEmoji(name: string): string {
  const haystack = normalize(name);
  for (const [keywords, emoji] of RULES) {
    if (keywords.some((k) => haystack.includes(k))) return emoji;
  }
  return '';
}
