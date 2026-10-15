/**
 * Every identity asset derived from the portrait and the monogram.
 *
 *   python monogram.py   # only when the monogram changes → public/favicon.svg
 *   node identity.mjs    # everything below
 *
 * From public/images/profile.jpg (never modified):
 *   images/profile-face.jpg        approved face crop, 256px (navbar/footer)
 *   images/profile-face-{64,128}.webp  the sizes the avatars actually draw
 *   images/profile-{320,480}.webp  hero portrait sizes (144–208 CSS px, 1x–3x)
 * From public/favicon.svg:
 *   favicon.ico (16/32/48), favicon-{16,32}.png, apple-touch-icon.png (180),
 *   icon-{192,512}.png, icon-maskable-512.png
 * From templates/og.html, rendered in Chromium with the site's own fonts:
 *   og.png (1200×630)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { launch } from './lib/pipeline.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public');
const PHOTO = join(pub, 'images/profile.jpg');

/** The face crop approved on 2026-10-15: a 260px square around the face. */
const FACE = { left: 178, top: 82, width: 260, height: 260 };

const out = (rel) => join(pub, rel);
const log = (rel, buf) => console.log(`  ${rel.padEnd(32)} ${(buf.length / 1024).toFixed(1)} KB`);
async function write(rel, buf) {
  writeFileSync(out(rel), buf);
  log(rel, buf);
}

// ── Portrait ────────────────────────────────────────────────────────────
console.log('portrait');
const face = sharp(PHOTO).extract(FACE);
await write('images/profile-face.jpg', await face.clone().resize(256, 256, { kernel: 'lanczos3' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer());
for (const size of [64, 128]) {
  await write(`images/profile-face-${size}.webp`, await face.clone().resize(size, size, { kernel: 'lanczos3' }).webp({ quality: 82 }).toBuffer());
}
for (const size of [320, 480]) {
  await write(`images/profile-${size}.webp`, await sharp(PHOTO).resize(size, size, { kernel: 'lanczos3' }).webp({ quality: 80 }).toBuffer());
}

// ── Icons ───────────────────────────────────────────────────────────────
console.log('icons');
const svg = readFileSync(out('favicon.svg'));
/** Rasterise the SVG at the target size (density scales the 64-unit viewBox). */
const raster = (source, size) => sharp(source, { density: (72 * size) / 64 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// Apple and Android draw their own mask: full-bleed square, letters inset.
const fullBleed = (inset) =>
  Buffer.from(
    svg
      .toString()
      .replace(/rx="14"/, 'rx="0"')
      .replace('<path ', `<path transform="translate(32 32) scale(${inset}) translate(-32 -32)" `),
  );

const png16 = await raster(svg, 16);
const png32 = await raster(svg, 32);
const png48 = await raster(svg, 48);
await write('favicon-16.png', png16);
await write('favicon-32.png', png32);
await write('apple-touch-icon.png', await raster(fullBleed(0.9), 180));
await write('icon-192.png', await raster(svg, 192));
await write('icon-512.png', await raster(svg, 512));
// Maskable: the letters must sit inside the central 80% safe zone.
await write('icon-maskable-512.png', await raster(fullBleed(0.72), 512));

// ICO with embedded PNGs (supported by every browser that still asks for .ico).
const images = [[16, png16], [32, png32], [48, png48]];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(([size, data], i) => {
  const e = 6 + i * 16;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(data.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += data.length;
});
await write('favicon.ico', Buffer.concat([header, ...images.map(([, d]) => d)]));

// ── Open Graph card ─────────────────────────────────────────────────────
console.log('og');
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(here, 'templates/og.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  if (!fonts.some((f) => f.includes('Space Grotesk')) || !fonts.some((f) => f.includes('Inter'))) {
    throw new Error(`og: site fonts did not load (${fonts})`);
  }
  await page.locator('img').evaluate((img) => img.decode());
  const png = await page.screenshot({ type: 'png' });
  // 256-colour palette: ~83 KB instead of ~280 KB, no visible banding (checked).
  await write('og.png', await sharp(png).png({ palette: true, quality: 100, effort: 10, compressionLevel: 9 }).toBuffer());
} finally {
  await browser.close();
}
