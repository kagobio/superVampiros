// Función serverless (Netlify) que sugiere recetas con IA a partir del inventario.
// Usa Groq (capa gratuita, sin tarjeta) con un modelo Llama. La clave
// (GROQ_API_KEY) vive en el servidor, nunca en el cliente.

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: 'La IA no está configurada (falta GROQ_API_KEY).' }, { status: 503 });
  }

  let items = [];
  try {
    const body = await req.json();
    items = Array.isArray(body.items) ? body.items.filter((x) => typeof x === 'string') : [];
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (items.length === 0) {
    return Response.json({ error: 'No hay productos en el inventario.' }, { status: 400 });
  }

  const prompt =
    'Ingredientes disponibles en casa:\n' +
    items.map((i) => `- ${i}`).join('\n') +
    '\n\nSugiere 4 recetas sencillas y realistas que se puedan hacer sobre todo con esos ingredientes ' +
    '(puedes asumir básicos como sal, aceite y agua). Los pasos, breves y claros, en español.\n\n' +
    'Responde con un objeto JSON con esta forma EXACTA:\n' +
    '{"recetas":[{"nombre":"string","ingredientes":[{"nombre":"string","tengo":true}],"pasos":["string"]}]}\n' +
    'En cada ingrediente, "tengo" es true si está en la lista de arriba, o false si hay que comprarlo.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un ayudante de cocina español. Respondes solo con JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
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
      return Response.json({ error: `Groq ${res.status}: ${detail || 'sin detalle'}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    // El modelo devuelve un objeto {recetas:[...]}; extraemos el array.
    let recetas = [];
    try {
      const parsed = JSON.parse(text);
      recetas = Array.isArray(parsed) ? parsed : (parsed.recetas ?? parsed.recipes ?? []);
    } catch {
      recetas = [];
    }
    return Response.json(recetas);
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
