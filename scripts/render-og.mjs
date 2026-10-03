/**
 * Renders public/og.svg to public/og.png (1200x630), the image the Open Graph
 * and Twitter card meta tags point at. Social crawlers do not render SVG, so
 * the PNG is the artefact that ships.
 *
 *   npm run og
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/og.svg');
const target = resolve(root, 'public/og.png');

const resvg = new Resvg(readFileSync(source, 'utf8'), {
  fitTo: { mode: 'width', value: 1200 },
  background: '#0B0D0F',
  font: { loadSystemFonts: true },
});

writeFileSync(target, resvg.render().asPng());
console.log(`Wrote ${target}`);
