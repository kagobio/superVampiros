// Función serverless (Netlify) del "Chef IA": chat de recetas basado en el
// inventario. Usa Groq (capa gratuita, sin tarjeta) con un modelo Llama. La
// clave (GROQ_API_KEY) vive en el servidor, nunca en el cliente.
//
// Petición: { items: string[], messages: [{ role, content }] }
//  - items: nombres de los productos en stock (contexto del asistente).
//  - messages: historial del chat (user/assistant). El content de assistant es el
//    JSON del turno anterior, para mantener el contexto conversacional.
// Respuesta: { mensaje, recetas: [...] }.

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const systemPrompt = (items) =>
  'Eres el "Chef IA", un ayudante de cocina español, cercano y práctico.\n' +
  'El usuario tiene estos ingredientes en casa:\n' +
  items.map((i) => `- ${i}`).join('\n') +
  '\n\nSugiere recetas realistas basadas SOBRE TODO en lo que tiene (puedes asumir ' +
  'básicos: sal, aceite, agua, especias). Atiende sus peticiones (más sano, rápido, ' +
  'vegetariano, para X personas, usar lo que caduca, etc.) e itera sobre recetas anteriores ' +
  'si te lo pide. Habla en español, con pasos breves y claros.\n\n' +
  'Responde SIEMPRE con un objeto JSON con esta forma EXACTA:\n' +
  '{"mensaje":"string","recetas":[{"nombre":"string","ingredientes":[{"nombre":"string","tengo":true}],"pasos":["string"]}]}\n' +
  '- "mensaje": una frase breve y natural (p. ej. "Aquí tienes una versión más ligera").\n' +
  '- "recetas": 0 o más recetas. Puede ir vacío si solo respondes o pides una aclaración.\n' +
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
  let history = [];
  try {
    const body = await req.json();
    items = Array.isArray(body.items) ? body.items.filter((x) => typeof x === 'string') : [];
    history = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string',
          )
          .slice(-12) // acota el contexto a los últimos turnos
          .map((m) => ({ role: m.role, content: m.content }))
      : [];
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (items.length === 0) {
    return Response.json({ error: 'No hay productos en el inventario.' }, { status: 400 });
  }
  if (history.length === 0) {
    return Response.json({ error: 'No hay ningún mensaje.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt(items) }, ...history],
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
      return Response.json(
        { error: `Groq ${res.status}: ${detail || 'sin detalle'}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    let mensaje = '';
    let recetas = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        recetas = parsed;
      } else if (parsed && typeof parsed === 'object') {
        mensaje = typeof parsed.mensaje === 'string' ? parsed.mensaje : '';
        recetas = parsed.recetas ?? parsed.recipes ?? [];
      }
    } catch {
      mensaje = String(text).slice(0, 500);
    }
    return Response.json({ mensaje, recetas: Array.isArray(recetas) ? recetas : [] });
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
