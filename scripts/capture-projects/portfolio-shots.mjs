/**
 * Screenshot the portfolio itself across every combination that has to work:
 * English and Arabic, light and dark, mobile and desktop.
 *
 *   node portfolio-shots.mjs [baseUrl] [outDir]
 *
 * Writes full-page PNGs plus a short report of anything that looks broken —
 * horizontal overflow, missing translations, console errors, failed requests.
 * Output goes outside the repo by default; these are for review, not shipping.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = process.argv[3] ?? join(process.env.TEMP ?? '.', 'portfolio-shots');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
const LANGS = [
  { name: 'en', path: '/' },
  { name: 'ar', path: '/?lang=ar' },
];
const SCHEMES = ['light', 'dark'];

const browser = await launch();
const report = [];

for (const viewport of VIEWPORTS) {
  for (const lang of LANGS) {
    for (const scheme of SCHEMES) {
      const tag = `${lang.name}-${scheme}-${viewport.name}`;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
        deviceScaleFactor: 1,
        colorScheme: scheme,
        // Reveal animations are opacity-0 until observed; disabling motion
        // makes every section render so the screenshot shows real content.
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      const consoleErrors = [];
      const failed = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 120)));
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120));
      });
      page.on('response', (r) => {
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(-60)}`);
      });

      await page.goto(BASE + lang.path, { waitUntil: 'networkidle', timeout: 60_000 });
      // Walk the page so lazy images resolve; otherwise the image check below
      // flags everything below the fold as broken when it is merely pending.
      await page.evaluate(async () => {
        const height = document.body.scrollHeight;
        for (let y = 0; y < height; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 110));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(2000);

      const checks = await page.evaluate(() => {
        const overflow = [...document.querySelectorAll('body *')]
          .filter((n) => n.getBoundingClientRect().right > window.innerWidth + 1)
          .map((n) => `${n.tagName}.${String(n.className).slice(0, 40)}`)
          .slice(0, 4);
        const untranslated = [...document.querySelectorAll('*')]
          .map((n) => n.textContent ?? '')
          .filter((t) =>
            /^(projects|nav|hero|about|skills|education|experience|contact|footer|a11y|meta|stats|services)\./.test(
              t.trim(),
            ),
          )
          .slice(0, 4);
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          dark: document.documentElement.classList.contains('dark'),
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          overflow,
          untranslated,
          sections: [...document.querySelectorAll('main section[id]')].map((s) => s.id),
          cards: document.querySelectorAll('#projects li.group').length,
          images: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length,
        };
      });

      const file = join(OUT, `${tag}.png`);
      await page.screenshot({ path: file, fullPage: true });

      report.push({ tag, ...checks, consoleErrors, failed });
      const bad =
        checks.scrollW > checks.clientW ||
        checks.overflow.length ||
        checks.untranslated.length ||
        checks.images ||
        consoleErrors.length ||
        failed.length;
      console.log(
        `${bad ? '✗' : '✓'} ${tag.padEnd(20)} lang=${checks.lang} dir=${checks.dir} dark=${checks.dark} cards=${checks.cards} scroll=${checks.scrollW}/${checks.clientW}` +
          (checks.overflow.length ? ` OVERFLOW:${checks.overflow[0]}` : '') +
          (checks.untranslated.length ? ` UNTRANSLATED:${checks.untranslated[0]}` : '') +
          (checks.images ? ` BROKEN_IMAGES:${checks.images}` : '') +
          (consoleErrors.length ? ` ERRORS:${consoleErrors[0]}` : '') +
          (failed.length ? ` HTTP:${failed[0]}` : ''),
      );

      await context.close();
    }
  }
}

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\nscreenshots + report.json in ${OUT}`);

await browser.close();
