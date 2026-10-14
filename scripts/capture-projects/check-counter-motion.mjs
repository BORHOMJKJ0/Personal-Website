/** Verify visible digit effects, all replay paths and live reduced-motion changes.
 * node check-counter-motion.mjs [baseUrl] [outDir]
 */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = process.argv[3] ?? join(tmpdir(), 'portfolio-counter-checks');
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const effects = ['digit-roll-in', 'digit-flip-in', 'digit-bounce-in', 'digit-wipe-in'];

try {
  for (const width of [390, 1440]) {
    for (const lang of ['en', 'ar']) {
      for (const theme of ['light', 'dark']) {
        const tag = `${lang}-${theme}-${width}`;
        const context = await browser.newContext({
          viewport: { width, height: 900 }, colorScheme: theme,
          isMobile: width < 600, hasTouch: width < 600, reducedMotion: 'no-preference',
        });
        try {
          const page = await context.newPage();
          await page.goto(`${BASE}/?lang=${lang}`, { waitUntil: 'domcontentloaded' });
          const strip = page.locator('.stat-strip');
          await strip.scrollIntoViewIfNeeded();
          await page.waitForFunction(() => [...document.querySelectorAll('.stat-card')].every((n) => Number(n.getAttribute('data-counter-run')) > 0));
          const names = await page.locator('.stat-card').evaluateAll((cards) => cards.map((card) => getComputedStyle(card.querySelector('.digit-current')).animationName));
          assert.deepEqual(names, effects);
          await page.waitForTimeout(1000);
          await strip.screenshot({ path: join(OUT, `${tag}-counting.png`) });
          await page.waitForFunction(() => document.querySelectorAll('.stat-card.is-counting').length === 0);
          await page.waitForTimeout(1200);
          const digits = await page.locator('.counter-final').allTextContents();
          assert.deepEqual(digits, ['150+', '20+', '60+', '8']);
          assert.ok(await page.locator('.counter-final').evaluateAll((nodes) => nodes.every((node) =>
            getComputedStyle(node).display === 'block' && getComputedStyle(node).visibility === 'visible',
          )));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          await strip.screenshot({ path: join(OUT, `${tag}-settled.png`) });

          const runs = () => page.locator('.stat-card').evaluateAll((cards) => cards.map((n) => Number(n.getAttribute('data-counter-run'))));
          let previous = await runs();
          await page.locator('.stats-replay').click();
          await page.waitForFunction((previous) => [...document.querySelectorAll('.stat-card')].every((n, i) => Number(n.getAttribute('data-counter-run')) > previous[i]), previous);
          await page.waitForFunction(() => document.querySelectorAll('.stat-card.is-counting').length === 0);
          if (width === 1440) {
            previous = await runs();
            await page.locator('.stat-card').first().hover();
            await page.waitForFunction((run) => Number(document.querySelector('.stat-card').getAttribute('data-counter-run')) > run, previous[0]);
            await page.mouse.move(0, 0);
          }
          previous = await runs();
          await page.locator('#contact').scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);
          await strip.scrollIntoViewIfNeeded();
          await page.waitForFunction((previous) => [...document.querySelectorAll('.stat-card')].every((n, i) => Number(n.getAttribute('data-counter-run')) > previous[i]), previous);

          // Switching this preference mid-count must immediately show final values.
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.waitForFunction(() => document.querySelectorAll('.stat-card.is-counting').length === 0);
          assert.deepEqual(await page.locator('[data-counter]').allTextContents(), ['150+', '20+', '60+', '8']);
          assert.equal(await page.locator('.stats-replay').count(), 0);
          assert.ok(await page.locator('.digit-current').evaluateAll((nodes) => nodes.every((n) => getComputedStyle(n).animationName === 'none')));
          console.log(`PASS ${tag}: four digit effects, exact values, button/scroll replay and reduced motion`);
        } finally {
          await context.close();
        }
      }
    }
  }
  console.log(`Counter screenshots: ${OUT}`);
} finally {
  await browser.close();
}
