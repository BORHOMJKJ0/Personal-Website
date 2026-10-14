/**
 * Fetch and normalise organisation logos into public/logos/.
 *
 *   npm run logos
 *
 * Some official sites sit behind bot challenges that plain HTTP clients cannot
 * pass, so a real browser does the fetching. Anything that still cannot be
 * found is reported, and the site falls back to an initials badge for it.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PUBLIC_DIR, ensureDir, kb, launch, log, newPage, relative } from './lib/pipeline.mjs';

const LOGOS_DIR = ensureDir(join(PUBLIC_DIR, 'logos'));

/** Logo box the site renders into; keep the source comfortably larger. */
const TARGET = 320;

const sources = [
  {
    slug: 'maps',
    label: 'Multi Aid Programs (MAPs)',
    page: 'https://multiaidprograms.org/',
    // Prefer an <img> whose src or alt mentions the brand.
    pick: `(() => {
      const score = (el) => {
        const src = (el.currentSrc || el.src || '').toLowerCase();
        const alt = (el.alt || '').toLowerCase();
        let s = 0;
        if (/logo/.test(src) || /logo/.test(alt)) s += 10;
        if (/maps/.test(src) || /maps/.test(alt)) s += 6;
        if (el.closest('header,nav,.navbar,.site-header')) s += 5;
        if (/\\.svg(\\?|$)/.test(src)) s += 4;
        const r = el.getBoundingClientRect();
        if (r.width > 40 && r.width < 420 && r.height > 20) s += 3;
        return s;
      };
      const imgs = [...document.images].filter((i) => (i.currentSrc || i.src));
      imgs.sort((a, b) => score(b) - score(a));
      return imgs.length && score(imgs[0]) > 6 ? (imgs[0].currentSrc || imgs[0].src) : null;
    })()`,
  },
];

const browser = await launch();
const report = [];

for (const source of sources) {
  log(`\n▶ ${source.slug} — ${source.label}`);
  const { context, page } = await newPage(browser, { deviceScaleFactor: 1 });
  try {
    await page.goto(source.page, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000); // let any challenge settle

    const url = await page.evaluate(source.pick);
    if (!url) throw new Error('no logo image found on the page');
    log(`  found: ${url.slice(0, 95)}`);

    const response = await page.request.get(url);
    if (!response.ok()) throw new Error(`fetch returned ${response.status()}`);
    const body = await response.body();

    const isSvg =
      url.toLowerCase().includes('.svg') ||
      body.slice(0, 400).toString('utf8').trim().startsWith('<svg');

    let out;
    if (isSvg) {
      out = join(LOGOS_DIR, `${source.slug}.svg`);
      writeFileSync(out, body);
    } else {
      out = join(LOGOS_DIR, `${source.slug}.png`);
      await sharp(body)
        .resize(TARGET, TARGET, { fit: 'inside', withoutEnlargement: false })
        .png({ compressionLevel: 9, palette: true })
        .toFile(out);
    }
    log(`  ${relative(out)}  ${kb(out)}`);
    report.push({ slug: source.slug, ok: true, file: relative(out), from: url });
  } catch (error) {
    log(`  ✗ ${error.message}`);
    report.push({ slug: source.slug, ok: false, reason: error.message });
  } finally {
    await context.close();
  }
}

await browser.close();

log('\n── summary ──');
for (const r of report) {
  log(`${r.ok ? '✓' : '✗'} ${r.slug.padEnd(10)} ${r.ok ? r.file : r.reason}`);
}
