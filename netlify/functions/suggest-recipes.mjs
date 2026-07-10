// Función serverless (Netlify) que sugiere recetas con la IA gratuita de Google
// Gemini a partir del inventario. La clave (GEMINI_API_KEY) vive en el servidor,
// nunca en el cliente. Modelo de la capa gratuita: gemini-2.0-flash.

const MODEL = 'gemini-2.0-flash';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'La IA no está configurada (falta GEMINI_API_KEY).' },
      { status: 503 },
    );
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
    'Eres un ayudante de cocina español. Con estos ingredientes disponibles en casa:\n' +
    items.map((i) => `- ${i}`).join('\n') +
    '\n\nSugiere 4 recetas sencillas y realistas que se puedan hacer sobre todo con esos ingredientes ' +
    '(puedes asumir básicos como sal, aceite y agua). Los pasos, breves y claros, en español.\n\n' +
    'Responde ÚNICAMENTE con un array JSON válido (sin texto ni ```), con este formato exacto:\n' +
    '[{"nombre":"string","ingredientes":[{"nombre":"string","tengo":true}],"pasos":["string"]}]\n' +
    'En cada ingrediente, "tengo" es true si está en la lista de arriba, o false si hay que comprarlo.';

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
        }),
      },
    );

    if (!res.ok) {
      // Devolvemos el error real de Gemini para poder diagnosticar.
      let detail = '';
      try {
        const e = await res.json();
        detail = e?.error?.message ?? JSON.stringify(e).slice(0, 300);
      } catch {
        detail = (await res.text().catch(() => '')).slice(0, 300);
      }
      return Response.json({ error: `Gemini ${res.status}: ${detail || 'sin detalle'}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason ?? 'sin contenido';
      return Response.json({ error: `La IA no devolvió recetas (${reason}).` }, { status: 502 });
    }
    return new Response(text, { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
