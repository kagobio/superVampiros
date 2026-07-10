/**
 * Adivina un emoji apropiado a partir del nombre del producto. Heurística por
 * palabras clave (sin acentos, minúsculas). Devuelve '' si no hay coincidencia,
 * para que el avatar use su icono de reserva.
 */

/** Pares [palabras clave, emoji]. El orden importa: gana la primera que casa. */
const RULES: Array<[string[], string]> = [
  [['leche'], '🥛'],
  [['huevo'], '🥚'],
  // Palabras cortas ambiguas: se acotan con espacios (` pan ` no casa `panceta`).
  [[' pan ', 'baguette'], '🍞'],
  [['agua'], '💧'],
  [['cafe'], '☕'],
  [[' te ', 'infusion'], '🍵'],
  [['arroz'], '🍚'],
  [['pasta', 'espagueti', 'macarron', 'fideo'], '🍝'],
  [['harina'], '🌾'],
  [['aceite', 'oliva'], '🫒'],
  [[' sal '], '🧂'],
  [['azucar'], '🍬'],
  [['tomate'], '🍅'],
  [['queso'], '🧀'],
  [['yogur'], '🍶'],
  [['mantequilla'], '🧈'],
  [['pollo'], '🍗'],
  [['carne', 'ternera', 'cerdo', 'filete'], '🥩'],
  [['bacon', 'panceta', 'jamon', 'chorizo', 'embutido'], '🥓'],
  [['pescado', 'atun', 'merluza', 'salmon', 'sardina'], '🐟'],
  [['gamba', 'marisco', 'langostino'], '🦐'],
  [['manzana'], '🍎'],
  [['platano', 'banana'], '🍌'],
  [['naranja', 'mandarina'], '🍊'],
  [['limon'], '🍋'],
  [['fresa'], '🍓'],
  [['uva'], '🍇'],
  [['sandia'], '🍉'],
  [['patata', 'papa'], '🥔'],
  [['cebolla'], '🧅'],
  [['ajo'], '🧄'],
  [['zanahoria'], '🥕'],
  [['lechuga', 'ensalada', 'espinaca'], '🥬'],
  [['pimiento'], '🫑'],
  [['maiz'], '🌽'],
  [['champinon', 'seta'], '🍄'],
  [['cerveza'], '🍺'],
  [['vino'], '🍷'],
  [['refresco', 'cola', 'soda', 'zumo', 'jugo'], '🥤'],
  [['chocolate', 'cacao'], '🍫'],
  [['galleta'], '🍪'],
  [['helado'], '🍦'],
  [['miel'], '🍯'],
  [['pizza'], '🍕'],
  [['papel', 'servilleta'], '🧻'],
  [['jabon', 'gel', 'champu', 'detergente', 'limpieza', 'suavizante'], '🧼'],
  [['pañal', 'panal'], '🍼'],
  [['pila', 'bateria'], '🔋'],
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
