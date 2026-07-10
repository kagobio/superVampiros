import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

// Formatos habituales de producto (EAN/UPC) + algunos extra. Acotarlos mejora
// mucho la fiabilidad frente a probar "todos".
const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];

/**
 * Arranca el escáner de códigos con la cámara trasera. Carga ZXing de forma
 * perezosa (este módulo solo se importa al abrir el escáner). Devuelve los
 * controles para poder detenerlo.
 */
export async function startBarcodeScanner(
  video: HTMLVideoElement,
  onResult: (code: string) => void,
): Promise<IScannerControls> {
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);

  const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });

  return reader.decodeFromConstraints(
    {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    video,
    (result) => {
      if (result) onResult(result.getText());
    },
  );
}
