/**
 * Assert that no Arabic prefix ending in tatweel (بـ, الـ, بالـ) is split from
 * the Latin word it attaches to by a line break.
 *
 * Measures the real layout: a Range around the prefix and a Range around the
 * following Latin word are compared by their client rect `top`. Different tops
 * means they landed on different lines.
 *
 *   node check-arabic-wrap.mjs [baseUrl]
 */
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const WIDTHS = [1440, 1024, 768, 390, 360];

const browser = await launch();
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 600,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/?lang=ar`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(900);

  const split = await page.evaluate(() => {
    // Prefix ending in tatweel, optional no-break space, then a Latin word.
    const re = /[؀-ۿ]+ـ[\s ]*[A-Za-z][A-Za-z.+-]*/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = [];

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      if (!/[ـ]/.test(text)) continue;
      const el = node.parentElement;
      if (!el || !el.offsetParent) continue;

      for (const m of text.matchAll(re)) {
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        // More than one rect with distinct tops means the pair wrapped.
        const tops = new Set(rects.map((r) => Math.round(r.top)));
        if (tops.size > 1) {
          bad.push({
            text: m[0].replace(/ /g, '·'),
            where: (el.textContent ?? '').trim().slice(0, 50),
            lines: tops.size,
          });
        }
      }
    }
    return bad;
  });

  if (split.length) {
    failures += split.length;
    console.log(`✗ ${String(width).padStart(4)}px — ${split.length} split pair(s)`);
    for (const s of split.slice(0, 5)) {
      console.log(`     "${s.text}" across ${s.lines} lines — in: ${s.where}`);
    }
  } else {
    console.log(`✓ ${String(width).padStart(4)}px — no prefix split from its Latin word`);
  }

  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall widths clean');
process.exit(failures ? 1 : 0);
