/**
 * Lectura de PDF (facturas/tickets) en el navegador con pdf.js. Es una librería
 * pesada, así que se importa de forma perezosa (dynamic import) solo cuando el
 * usuario elige un PDF. El worker se empaqueta localmente (`?url`) para que
 * funcione sin red (PWA offline).
 */

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

/** Extrae el texto de un PDF (hasta `maxPages` páginas). Vacío si es escaneado. */
export async function extractPdfText(file: File, maxPages = 10): Promise<string> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const pages: string[] = [];
    const n = Math.min(doc.numPages, maxPages);
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) pages.push(text);
    }
    return pages.join('\n').trim();
  } finally {
    await doc.destroy();
  }
}

/** Renderiza la primera página del PDF a un data URL JPEG (para PDF escaneados). */
export async function renderPdfFirstPageToDataUrl(file: File, maxSize = 1500): Promise<string> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.max(0.1, Math.min(2, maxSize / Math.max(base.width, base.height)));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) throw new Error('No se pudo procesar el PDF.');
    await page.render({ canvasContext, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    await doc.destroy();
  }
}
