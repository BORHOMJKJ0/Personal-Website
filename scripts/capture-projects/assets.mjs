/**
 * One-off asset preparation that does not need a browser:
 *   - normalise the downloaded university logo
 *   - generate the neutral placeholder profile photo
 *
 *   node assets.mjs
 */
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PUBLIC_DIR, ensureDir, kb, log, relative } from './lib/pipeline.mjs';

const LOGOS = ensureDir(join(PUBLIC_DIR, 'logos'));
const IMAGES = ensureDir(join(PUBLIC_DIR, 'images'));

/* ── Damascus University ──────────────────────────────────────────────────
   Source: en.wikipedia.org/wiki/File:Damascus_University.png (the official
   seal). Its artwork is dark on transparent, so it vanishes on a dark
   background — the site always renders org logos on a light tile, which is
   why no recolouring is needed here.                                       */
const rawUniversity = join(LOGOS, '_damascus-university-raw.png');
if (existsSync(rawUniversity)) {
  const out = join(LOGOS, 'damascus-university.png');
  await sharp(rawUniversity)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  rmSync(rawUniversity, { force: true });
  log(`${relative(out)}  ${kb(out)}`);
} else {
  log('damascus-university.png already prepared (no raw file to process)');
}

/* ── Placeholder profile photo ────────────────────────────────────────────
   A neutral avatar so the hero has correct dimensions before a real photo
   exists. The component crops with object-fit, so only the file name and the
   1:1 ratio matter — this is replaced by dropping in a new profile.jpg.     */
const AVATAR = 640;
const avatarSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR}" height="${AVATAR}" viewBox="0 0 640 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E7EDEC"/>
      <stop offset="100%" stop-color="#D3DEDC"/>
    </linearGradient>
  </defs>
  <rect width="640" height="640" fill="url(#bg)"/>
  <circle cx="320" cy="252" r="104" fill="#9BB0AD"/>
  <path d="M320 384c-106 0-176 64-190 152h380c-14-88-84-152-190-152z" fill="#9BB0AD"/>
</svg>`);

const profile = join(IMAGES, 'profile.jpg');
await sharp(avatarSvg).jpeg({ quality: 86, progressive: true }).toFile(profile);
log(`${relative(profile)}  ${kb(profile)}`);
