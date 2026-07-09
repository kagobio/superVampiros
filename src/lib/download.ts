/** Descarga un texto como archivo desde el navegador. */
export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Nombre de archivo con fecha (YYYY-MM-DD) para exportaciones. */
export function datedFilename(base: string, ext: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `${base}-${stamp}.${ext}`;
}
