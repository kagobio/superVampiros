// Función serverless (Netlify) que clasifica un producto en una de las
// categorías EXISTENTES del usuario. Usa Groq (misma clave que las recetas).
// Nunca inventa categorías nuevas: devuelve una de la lista o cadena vacía.
//
// Petición: { name: string, categories: string[] }
// Respuesta: { categoria: string }  (nombre exacto de la lista, o "")

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: 'La IA no está configurada.' }, { status: 503 });
  }

  let name = '';
  let categories = [];
  try {
    const body = await req.json();
    name = typeof body.name === 'string' ? body.name.trim() : '';
    categories = Array.isArray(body.categories)
      ? body.categories.filter((c) => typeof c === 'string' && c.trim()).slice(0, 40)
      : [];
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (!name || categories.length === 0) {
    return Response.json({ categoria: '' });
  }

  const prompt =
    `Producto a clasificar: "${name}"\n\n` +
    'Categorías del usuario (debes elegir EXACTAMENTE una de esta lista):\n' +
    categories.map((c) => `- ${c}`).join('\n') +
    '\n\nCómo decidir:\n' +
    '- Fíjate en QUÉ ES el producto y para qué se usa en casa.\n' +
    '- Alimentos y bebidas van a categorías de comida (despensa, nevera, congelador, ' +
    'bebidas y similares). NUNCA pongas un alimento o una bebida en categorías de ' +
    'limpieza, higiene/baño ni mascotas.\n' +
    '- Productos de limpieza del hogar (detergente, lejía, friegasuelos, bayetas…) → la ' +
    'categoría de limpieza.\n' +
    '- Higiene y cuidado personal (pasta de dientes, gel, champú, papel higiénico…) → la ' +
    'categoría de baño.\n' +
    '- Comida o accesorios de mascotas → la categoría de mascotas.\n' +
    '- Si dudas entre varias de comida, elige la más lógica por conservación (fresco → ' +
    'nevera, congelado → congelador, no perecedero → despensa).\n' +
    '- Elige SIEMPRE la más adecuada de la lista; no dejes la categoría vacía. Usa el ' +
    'nombre EXACTO de la lista.\n\n' +
    'Piensa primero brevemente y responde con este JSON EXACTO: ' +
    '{"razon":"<explicación muy breve>","categoria":"<nombre EXACTO de la lista>"}.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente que clasifica productos de la compra en las categorías del ' +
              'hogar del usuario según qué es cada producto y para qué se usa. Respondes solo ' +
              'con JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      return Response.json({ error: `Groq ${res.status}: ${detail}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    let categoria = '';
    try {
      const parsed = JSON.parse(text);
      categoria = typeof parsed.categoria === 'string' ? parsed.categoria : '';
    } catch {
      categoria = '';
    }
    return Response.json({ categoria });
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
