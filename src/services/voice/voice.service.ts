/**
 * Añadir productos dictando. El texto reconocido en el móvil (Web Speech API) se
 * manda a la función serverless, que lo convierte en productos con cantidad. La
 * respuesta tiene la misma forma que la del ticket, así que se reutilizan tanto la
 * validación (`parseReceiptResponse`) como la aplicación (`applyReceiptItems`).
 */
import { parseReceiptResponse, type ReceiptItem } from '@/services/receipt/receipt.service';

/** Envía lo dictado y devuelve los productos interpretados. */
export async function parseVoiceText(text: string): Promise<ReceiptItem[]> {
  if (!text.trim()) return [];
  const res = await fetch('/.netlify/functions/parse-voice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo interpretar lo que has dicho.');
  }
  return parseReceiptResponse(await res.text());
}
