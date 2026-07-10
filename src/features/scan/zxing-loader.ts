import type { IScannerControls } from '@zxing/browser';

/**
 * Arranca el escáner de códigos con la cámara trasera. Carga ZXing de forma
 * perezosa (es pesado) para no inflar el bundle inicial. Devuelve los controles
 * para poder detenerlo.
 */
export async function startBarcodeScanner(
  video: HTMLVideoElement,
  onResult: (code: string) => void,
): Promise<IScannerControls> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  return reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => {
    if (result) onResult(result.getText());
  });
}
