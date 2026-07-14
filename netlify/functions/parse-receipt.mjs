// Función serverless (Netlify) que lee un ticket de compra a partir de una foto.
// Usa un modelo con VISIÓN de Groq (misma clave que el resto de IA). Devuelve los
// productos con su cantidad y precio por unidad. Nunca añade nada: solo extrae.
//
// Petición: { image: "data:image/jpeg;base64,..." }
// Respuesta: { productos: [{ nombre, cantidad, precio }] }

const MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

const INSTRUCCIONES =
  'En la imagen hay un ticket de supermercado. Extrae SOLO los productos comprados.\n' +
  'Para cada producto devuelve:\n' +
  '- "nombre": nombre limpio y legible en español (sin códigos ni abreviaturas raras).\n' +
  '- "cantidad": número de unidades (por defecto 1).\n' +
  '- "precio": precio POR UNIDAD en euros, como número. Si el ticket muestra el total de la ' +
  'línea junto a una cantidad, divide el total entre la cantidad. Si no puedes leerlo, usa null.\n' +
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

  let image = '';
  try {
    const body = await req.json();
    image = typeof body.image === 'string' ? body.image : '';
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  if (!image.startsWith('data:image/')) {
    return Response.json({ error: 'Imagen no válida.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: INSTRUCCIONES },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
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
    const text = data?.choices?.[0]?.message?.content ?? '';
    let productos = [];
    try {
      const parsed = JSON.parse(text);
      productos = Array.isArray(parsed) ? parsed : (parsed.productos ?? parsed.items ?? []);
    } catch {
      productos = [];
    }
    return Response.json({ productos: Array.isArray(productos) ? productos : [] });
  } catch (e) {
    return Response.json({ error: `No se pudo leer el ticket: ${String(e)}` }, { status: 502 });
  }
};
