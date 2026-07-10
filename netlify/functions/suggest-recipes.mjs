// Función serverless (Netlify) que sugiere recetas con la IA gratuita de Google
// Gemini a partir del inventario. La clave (GEMINI_API_KEY) vive en el servidor,
// nunca en el cliente. Modelo de la capa gratuita: gemini-2.0-flash.

const MODEL = 'gemini-2.0-flash';

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      nombre: { type: 'STRING' },
      ingredientes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            nombre: { type: 'STRING' },
            tengo: { type: 'BOOLEAN' },
          },
          required: ['nombre', 'tengo'],
        },
      },
      pasos: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['nombre', 'ingredientes', 'pasos'],
  },
};

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
    '(puedes asumir básicos como sal, aceite, agua). Para cada ingrediente marca "tengo": true si está ' +
    'en la lista de arriba, o false si haría falta comprarlo. Los pasos, breves y claros. Responde en español.';

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.8,
          },
        }),
      },
    );

    if (!res.ok) {
      return Response.json({ error: 'La IA no respondió correctamente.' }, { status: 502 });
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    return new Response(text, { headers: { 'content-type': 'application/json' } });
  } catch {
    return Response.json({ error: 'No se pudo contactar con la IA.' }, { status: 502 });
  }
};
