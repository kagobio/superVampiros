// Función serverless (Netlify) del "chat del menú": edita un menú semanal ya
// existente. Recibe el menú actual + el inventario + el historial del chat y
// devuelve CAMBIOS concretos sobre huecos (poner/quitar plato). Usa Groq con la
// clave (GROQ_API_KEY) oculta en el servidor.
//
// Petición: { items: string[], menu: [{dia, momento, nombre}], messages: [{role, content}] }
// Respuesta: { mensaje, cambios: [{ dia, momento, accion, receta? }] }

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const describeMenu = (menu) => {
  if (!menu.length) return '(el menú está vacío)';
  return menu
    .map((s) => `- ${DAYS[s.dia] ?? `Día ${s.dia}`} / ${s.momento}: ${s.nombre}`)
    .join('\n');
};

const systemPrompt = (items, menu) =>
  'Eres un asistente que EDITA un menú semanal español (comida y cena de Lunes a Domingo).\n' +
  'Menú actual:\n' +
  describeMenu(menu) +
  '\n\nInventario del usuario:\n' +
  (items.length ? items.map((i) => `- ${i}`).join('\n') : '- (vacío)') +
  '\n\nAtiende la petición del usuario y responde SOLO con los CAMBIOS necesarios ' +
  '(no repitas los huecos que no cambian). Prioriza aprovechar el inventario; puedes asumir ' +
  'básicos (sal, aceite, agua, especias). Pasos breves. Habla en español.\n\n' +
  'Responde SIEMPRE con un objeto JSON con esta forma EXACTA:\n' +
  '{"mensaje":"string","cambios":[{"dia":0,"momento":"comida","accion":"set",' +
  '"receta":{"nombre":"string","ingredientes":[{"nombre":"string","tengo":true}],"pasos":["string"]}}]}\n' +
  '- "mensaje": una frase breve explicando lo que has hecho.\n' +
  '- "dia": entero 0-6 (0 = Lunes … 6 = Domingo). "momento": "comida" o "cena".\n' +
  '- "accion": "set" para poner/cambiar un plato (incluye "receta"), o "clear" para vaciar el hueco.\n' +
  '- "cambios" puede ir vacío si solo respondes o pides una aclaración.\n' +
  '- En cada ingrediente, "tengo" es true si está en el inventario, o false si hay que comprarlo.';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: 'La IA no está configurada (falta GROQ_API_KEY).' }, { status: 503 });
  }

  let items = [];
  let menu = [];
  let history = [];
  try {
    const body = await req.json();
    items = Array.isArray(body.items) ? body.items.filter((x) => typeof x === 'string') : [];
    menu = Array.isArray(body.menu)
      ? body.menu
          .filter((s) => s && typeof s === 'object' && typeof s.nombre === 'string')
          .map((s) => ({
            dia: Number(s.dia),
            momento: s.momento === 'cena' ? 'cena' : 'comida',
            nombre: s.nombre,
          }))
          .filter((s) => Number.isInteger(s.dia) && s.dia >= 0 && s.dia <= 6)
      : [];
    history = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string',
          )
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content }))
      : [];
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
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
        messages: [{ role: 'system', content: systemPrompt(items, menu) }, ...history],
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
      return Response.json({ error: `Groq ${res.status}: ${detail || 'sin detalle'}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    let mensaje = '';
    let cambios = [];
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        mensaje = typeof parsed.mensaje === 'string' ? parsed.mensaje : '';
        cambios = Array.isArray(parsed.cambios) ? parsed.cambios : [];
      }
    } catch {
      mensaje = String(text).slice(0, 500);
    }
    return Response.json({ mensaje, cambios: Array.isArray(cambios) ? cambios : [] });
  } catch (e) {
    return Response.json({ error: `No se pudo contactar con la IA: ${String(e)}` }, { status: 502 });
  }
};
