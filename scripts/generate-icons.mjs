// Genera los iconos PNG de la PWA a partir del logo SVG (public/favicon.svg).
// Se aplanan sobre el fondo oscuro para que sean "maskable" (sin esquinas
// transparentes). Ejecutar con: npm run icons
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'));
const background = '#0B0B0D';

const targets = [
  { size: 192, name: 'pwa-192.png' },
  { size: 512, name: 'pwa-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of targets) {
  await sharp(svg)
    .resize(size, size)
    .flatten({ background })
    .png()
    .toFile(join(root, 'public', name));
  console.log(`✓ public/${name} (${size}x${size})`);
}
