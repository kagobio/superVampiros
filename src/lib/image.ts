/**
 * Reduce y comprime una imagen (p. ej. la foto de un ticket) a un data URL JPEG,
 * para enviarla a la IA sin payloads enormes. Mantiene la relación de aspecto y
 * limita el lado mayor a `maxSize` px.
 */
export async function fileToDataUrl(file: File, maxSize = 1500, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', quality);
}
