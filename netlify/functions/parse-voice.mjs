// Función serverless (Netlify) que interpreta lo que el usuario ha dictado y lo
// convierte en productos con cantidad. Usa Groq (misma clave que el resto de IA).
//
// Petición: { text: "añade dos leches y un pan" }
// Respuesta: { productos: [{ nombre, cantidad, precio }] }

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: 'La IA no está configurada.' }, { status: 503 });
  }

  let text = '';
  try {
    const body = await req.json();
    text = typeof body.text === 'string' ? body.text.trim().slice(0, 1000) : '';
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (!text) return Response.json({ productos: [] });

  const prompt =
    'El usuario ha dictado en voz alta lo que quiere añadir a su inventario de casa.\n\n' +
    `Texto dictado: "${text}"\n\n` +
    'Extrae los productos mencionados. Para cada uno:\n' +
    '- "nombre": el producto en SINGULAR y con mayúscula inicial ("dos leches" → "Leche").\n' +
    '- "cantidad": número de unidades (por defecto 1). Entiende números escritos ("dos" → 2).\n' +
    '- "precio": precio POR UNIDAD en euros si lo menciona; si no, null.\n' +
    'Ignora muletillas y verbos ("añade", "apunta", "pon", "por favor"). Si no hay ningún ' +
    'producto claro, devuelve una lista vacía.\n\n' +
    'Responde SOLO con JSON: {"productos":[{"nombre":"string","cantidad":1,"precio":null}]}.';

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
              'Conviertes frases habladas en español en una lista estructurada de productos. ' +
              'Respondes solo con JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      return Response.json({ error: `Groq ${res.status}: ${detail}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    let productos = [];
    try {
      const parsed = JSON.parse(content);
      productos = Array.isArray(parsed) ? parsed : (parsed.productos ?? parsed.items ?? []);
    } catch {
      productos = [];
    }
    return Response.json({ productos: Array.isArray(productos) ? productos : [] });
  } catch (e) {
    return Response.json({ error: `No se pudo interpretar: ${String(e)}` }, { status: 502 });
  }
};
