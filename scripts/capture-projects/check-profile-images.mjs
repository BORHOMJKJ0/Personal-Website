/** Verify the actual portrait and MAPS bytes in EN/AR, both themes and sizes.
 * node check-profile-images.mjs [baseUrl] [outDir]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, PUBLIC_DIR } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = process.argv[3] ?? join(tmpdir(), 'portfolio-image-checks');
mkdirSync(OUT, { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const photoHash = hash(readFileSync(join(PUBLIC_DIR, 'images/profile.jpg')));
const mapsHash = hash(readFileSync(join(PUBLIC_DIR, 'logos/maps.png')));
const browser = await launch();
const report = [];

try {
  for (const width of [390, 1440]) {
    for (const lang of ['en', 'ar']) {
      for (const theme of ['light', 'dark']) {
        const tag = `${lang}-${theme}-${width}`;
        const context = await browser.newContext({
          viewport: { width, height: 900 },
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
          assert.equal(new URL(details.portrait.src).searchParams.get('v'), photoHash.slice(0, 12));
          assert.equal(details.maps.loaded, true);
          assert.equal(details.maps.fit, 'contain');
          assert.equal(details.maps.tile, 'rgb(255, 255, 255)');
          for (const [url, type, digest] of [
            [details.portrait.src, 'image/jpeg', photoHash],
            [details.maps.src, 'image/png', mapsHash],
          ]) {
            const response = await context.request.get(url);
            assert.equal(response.status(), 200);
            assert.ok(response.headers()['content-type'].startsWith(type));
            assert.equal(hash(await response.body()), digest);
          }
          assert.deepEqual(errors, []);
          // Capture the actual avatar crop and logo in their surrounding UI.
          await maps.locator('xpath=ancestor::li[1]').screenshot({ path: join(OUT, `${tag}-maps.png`) });
          await portrait.scrollIntoViewIfNeeded();
          await page.locator('#top').screenshot({ path: join(OUT, `${tag}-hero.png`) });
          report.push({ tag, ...details, errors });
          console.log(`PASS ${tag}: portrait + MAPS loaded, correct formats and bytes`);
        } finally {
          await context.close();
        }
      }
    }
  }
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Verified ${report.length} combinations. Screenshots: ${OUT}`);
} finally {
  await browser.close();
}
