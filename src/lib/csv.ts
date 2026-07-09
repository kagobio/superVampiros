/**
 * Serialización y parseo de CSV (RFC 4180 básico): comillas dobles para escapar
 * campos con comas, saltos de línea o comillas. Suficiente para importar/exportar
 * productos sin depender de una librería.
 */

/** Escapa un valor de celda si contiene caracteres especiales. */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serializa filas (cabecera + datos) a texto CSV. */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  return lines.join('\r\n');
}

/** Parsea texto CSV a una matriz de celdas (incluida la cabecera). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  // Última celda/fila (si el archivo no termina en salto de línea).
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
