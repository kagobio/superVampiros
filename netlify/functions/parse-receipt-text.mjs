// Función serverless (Netlify) que lee una factura/ticket a partir de su TEXTO
// (extraído de un PDF en el navegador). Usa un modelo de texto de Groq (misma
// clave que el resto de IA). Nunca añade nada: solo extrae los productos.
//
// Petición: { text: "contenido del PDF" }
// Respuesta: { productos: [{ nombre, cantidad, precio }] }

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const INSTRUCCIONES =
  'A continuación tienes el TEXTO de una factura o ticket de supermercado.\n' +
  'Extrae SOLO los productos comprados. Para cada producto devuelve:\n' +
  '- "nombre": nombre limpio y legible en español (sin códigos ni abreviaturas raras).\n' +
  '- "cantidad": número de unidades (por defecto 1).\n' +
  '- "precio": precio POR UNIDAD en euros, como número. Si aparece el total de la línea ' +
  'junto a una cantidad, divide el total entre la cantidad. Si no puedes deducirlo, usa null.\n' +
  'Ignora totales, subtotales, IVA/impuestos, descuentos, formas de pago, fecha y datos de la ' +
  'tienda.\n' +
  'Responde SOLO con JSON: {"productos":[{"nombre":"string","cantidad":1,"precio":0.00}]}.';

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
    text = typeof body.text === 'string' ? body.text.slice(0, 20000) : '';
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (text.trim().length < 10) {
    return Response.json({ error: 'El PDF no contiene texto legible.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: INSTRUCCIONES },
          { role: 'user', content: text },
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
    return Response.json({ error: `No se pudo leer la factura: ${String(e)}` }, { status: 502 });
  }
};
