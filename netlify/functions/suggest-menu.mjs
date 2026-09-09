// Función serverless (Netlify) que genera un MENÚ SEMANAL completo con IA a
// partir de las preferencias del usuario y su inventario. Usa Groq con la misma
// clave (GROQ_API_KEY) que el resto de funciones de IA, oculta en el servidor.
//
// Petición: { items: string[], preferences: string }
//  - items: nombres de los productos en stock (para marcar "tengo" y priorizar).
//  - preferences: texto libre con lo que quiere el usuario (dieta, tiempo, etc.).
// Respuesta: { nombre, comidas: [{ dia, momento, receta: { nombre, ingredientes, pasos } }] }

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const systemPrompt = (items, preferences) =>
  'Eres un planificador de menús español, práctico y realista.\n' +
  'El usuario tiene estos ingredientes en casa:\n' +
  (items.length ? items.map((i) => `- ${i}`).join('\n') : '- (inventario vacío)') +
  '\n\nPreferencias del usuario:\n' +
  (preferences?.trim() ? preferences.trim() : '(sin preferencias concretas: menú variado y equilibrado)') +
  '\n\nGenera un MENÚ SEMANAL completo (7 días, de Lunes a Domingo) con COMIDA y CENA ' +
  'cada día. Prioriza aprovechar lo que ya tiene en casa, pero completa con variedad y ' +
  'equilibrio según sus preferencias (puedes asumir básicos: sal, aceite, agua, especias). ' +
  'Evita repetir demasiado el mismo plato. Pasos breves y claros. Habla en español.\n\n' +
  'Responde SIEMPRE con un objeto JSON con esta forma EXACTA (sin texto fuera del JSON):\n' +
  '{"nombre":"string","comidas":[{"dia":0,"momento":"comida","receta":{"nombre":"string",' +
  '"ingredientes":[{"nombre":"string","tengo":true}],"pasos":["string"]}}]}\n' +
  '- "nombre": un título corto para el menú (p. ej. "Menú ligero de la semana").\n' +
  '- "dia": entero 0-6 (0 = Lunes … 6 = Domingo).\n' +
  '- "momento": "comida" o "cena".\n' +
  '- Incluye idealmente los 14 huecos (comida y cena de cada día).\n' +
  '- En cada ingrediente, "tengo" es true si está en la lista de arriba, o false si hay que comprarlo.';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'La IA no está configurada (falta GROQ_API_KEY).' },
      { status: 503 },
    );
  }

  let items = [];
  let preferences = '';
  try {
    const body = await req.json();
    items = Array.isArray(body.items) ? body.items.filter((x) => typeof x === 'string') : [];
    preferences = typeof body.preferences === 'string' ? body.preferences.slice(0, 1000) : '';
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt(items, preferences) },
          {
            role: 'user',
            content: `Genera el menú semanal (${DAYS.join(', ')}) con comida y cena.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const e = await res.json();
        detail = e?.error?.message ?? JSON.stringify(e).slice(0, 300);
      } catch {
        detail = (await res.text().catch(() => '')).slice(0, 300);
      }
      return Response.json(
        { error: `Groq ${res.status}: ${detail || 'sin detalle'}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    let nombre = '';
    let comidas = [];
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        nombre = typeof parsed.nombre === 'string' ? parsed.nombre : '';
        comidas = Array.isArray(parsed.comidas) ? parsed.comidas : [];
      }
    } catch {
      return Response.json({ error: 'La IA devolvió una respuesta no válida.' }, { status: 502 });
    }
    return Response.json({ nombre, comidas });
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
