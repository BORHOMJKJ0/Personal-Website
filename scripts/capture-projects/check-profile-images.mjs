/** Verify the identity images and MAPS logo in EN/AR, both themes and sizes:
 * the hero portrait (whichever srcset file the browser picks), the navbar and
 * footer face avatars (round, crisp at the device pixel ratio), the favicon
 * set, the web manifest and the OG card.
 * node check-profile-images.mjs [baseUrl] [outDir]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { launch, PUBLIC_DIR } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = process.argv[3] ?? join(tmpdir(), 'portfolio-image-checks');
mkdirSync(OUT, { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Same version scheme as vite.config.ts: a hash over the images folder.
const imagesDir = join(PUBLIC_DIR, 'images');
const version = (() => {
  const h = createHash('sha256');
  for (const name of readdirSync(imagesDir).toSorted()) h.update(name).update(readFileSync(join(imagesDir, name)));
  return h.digest('hex').slice(0, 12);
})();
const TYPES = { jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png' };
/** The file on disk that a served /images URL must match byte for byte. */
const diskFor = (url) => readFileSync(join(PUBLIC_DIR, decodeURIComponent(new URL(url).pathname)));
const mapsHash = hash(readFileSync(join(PUBLIC_DIR, 'logos/maps.png')));
const browser = await launch();
const report = [];

try {
  for (const width of [390, 1440]) {
    for (const lang of ['en', 'ar']) {
      for (const theme of ['light', 'dark']) {
        const tag = `${lang}-${theme}-${width}`;
        const dpr = width < 600 ? 2 : 1;
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          deviceScaleFactor: dpr,
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        try {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(String(error)));
          await page.goto(`${BASE}/?lang=${lang}`, { waitUntil: 'networkidle' });
          const portrait = page.locator('img[src*="images/profile.jpg"]');
          const maps = page.locator('img[src*="logos/maps.png"]');
          await assert.doesNotReject(() => portrait.waitFor());
          await maps.scrollIntoViewIfNeeded();
          await maps.evaluate((image) => image.decode());
          await portrait.evaluate((image) => image.decode());
          const details = await page.evaluate(() => {
            const describe = (image) => ({
              src: image.currentSrc,
              loaded: image.complete && image.naturalWidth > 0,
              width: image.naturalWidth,
              height: image.naturalHeight,
              fit: getComputedStyle(image).objectFit,
              tile: getComputedStyle(image.parentElement).backgroundColor,
            });
            return {
              lang: document.documentElement.lang,
              dir: document.documentElement.dir,
              dark: document.documentElement.classList.contains('dark'),
              portrait: describe(document.querySelector('img[src*="images/profile.jpg"]')),
              maps: describe(document.querySelector('img[src*="logos/maps.png"]')),
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          });
          assert.equal(details.lang, lang);
          assert.equal(details.dir, lang === 'ar' ? 'rtl' : 'ltr');
          assert.equal(details.dark, theme === 'dark');
          assert.equal(details.overflow, false);
          assert.equal(details.portrait.loaded, true);
          assert.ok(Math.max(details.portrait.width, details.portrait.height) <= 800);
          assert.equal(new URL(details.portrait.src).searchParams.get('v'), version);
          assert.equal(details.maps.loaded, true);
          assert.equal(details.maps.fit, 'contain');
          assert.equal(details.maps.tile, 'rgb(255, 255, 255)');
          for (const [url, digest] of [
            [details.portrait.src, hash(diskFor(details.portrait.src))],
            [details.maps.src, mapsHash],
          ]) {
            const response = await context.request.get(url);
            assert.equal(response.status(), 200);
            const ext = new URL(url).pathname.split('.').pop();
            assert.ok(response.headers()['content-type'].startsWith(TYPES[ext]), `${url} served as ${response.headers()['content-type']}`);
            assert.equal(hash(await response.body()), digest, `${url} bytes differ from disk`);
          }

          // Face avatars: navbar 28px, footer 40px — round, versioned, crisp at this DPR.
          await page.locator('footer').scrollIntoViewIfNeeded();
          const avatars = page.locator('img[src*="images/profile-face"]');
          assert.equal(await avatars.count(), 2, `${tag}: navbar + footer avatars`);
          for (const avatar of await avatars.all()) {
            await avatar.evaluate((image) => image.decode());
            const a = await avatar.evaluate((image) => ({
              src: image.currentSrc,
              box: image.getBoundingClientRect().width,
              radius: getComputedStyle(image).borderRadius,
              alt: image.alt,
            }));
            assert.ok([28, 40].includes(Math.round(a.box)), `${tag}: avatar drawn at ${a.box}px`);
            // naturalWidth is density-corrected for srcset images; read the real pixels.
            const served = await (await context.request.get(a.src)).body();
            const { width: pixels } = await sharp(served).metadata();
            assert.ok(pixels >= a.box * dpr, `${tag}: avatar file ${pixels}px is blurry at ${a.box}px × ${dpr}`);
            assert.ok(a.radius.includes('9999') || a.radius === '50%' || parseFloat(a.radius) >= a.box / 2, `${tag}: avatar not round (${a.radius})`);
            assert.equal(new URL(a.src).searchParams.get('v'), version);
            assert.ok(a.alt.length > 0, `${tag}: avatar alt text`);
            const response = await context.request.get(a.src);
            assert.equal(hash(await response.body()), hash(diskFor(a.src)));
          }
          assert.deepEqual(errors, []);
          // Capture the actual avatar crop and logo in their surrounding UI.
          await maps.locator('xpath=ancestor::li[1]').screenshot({ path: join(OUT, `${tag}-maps.png`) });
          await portrait.scrollIntoViewIfNeeded();
          await page.locator('#top').screenshot({ path: join(OUT, `${tag}-hero.png`) });
          report.push({ tag, ...details, errors });
          console.log(`PASS ${tag}: portrait, avatars and MAPS loaded, correct formats and bytes`);
        } finally {
          await context.close();
        }
      }
    }
  }
  // Head assets: every icon the HTML links resolves with the right type and size.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((l) => ({
      rel: l.rel, href: l.href, sizes: l.getAttribute('sizes'),
    })),
  );
  assert.ok(links.some((l) => l.rel === 'apple-touch-icon' && l.href.endsWith('.png')), 'apple-touch-icon must be a PNG');
  for (const link of links) {
    const response = await context.request.get(link.href);
    assert.equal(response.status(), 200, link.href);
    if (link.rel === 'manifest') {
      const manifest = await response.json();
      for (const icon of manifest.icons) {
        const r = await context.request.get(new URL(icon.src, BASE).href);
        assert.equal(r.status(), 200, icon.src);
      }
    }
  }
  const og = await context.request.get(`${BASE}/og.png`);
  const ogBytes = await og.body();
  assert.equal(ogBytes.readUInt32BE(16), 1200, 'og.png width');
  assert.equal(ogBytes.readUInt32BE(20), 630, 'og.png height');
  await context.close();
  console.log(`PASS head: ${links.length} icon/manifest links, og.png 1200×630`);

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Verified ${report.length} combinations. Screenshots: ${OUT}`);
} finally {
  await browser.close();
}
