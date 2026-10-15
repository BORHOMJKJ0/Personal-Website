/** Site regression across all eight combinations: every section reveals,
 * Arabic stays joined, university logos load, the progress bar fills, the
 * language switch re-renders, and the project dialog opens, closes on Escape
 * and returns focus. Motion timing itself is asserted in check-motion.mjs.
 * node check-site-motion.mjs [baseUrl]
 */
import assert from 'node:assert/strict';
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const browser = await launch();
const cases = [390, 1440].flatMap((width) =>
  ['en', 'ar'].flatMap((lang) =>
    ['light', 'dark'].map((theme) => ({ width, lang, theme, reducedMotion: 'no-preference' })),
  ),
);
cases.push(
  { width: 1440, lang: 'en', theme: 'light', reducedMotion: 'reduce' },
  { width: 390, lang: 'ar', theme: 'dark', reducedMotion: 'reduce' },
);

try {
  for (const test of cases.filter((test) => !process.argv[3] || `${test.lang}-${test.theme}-${test.width}-${test.reducedMotion}` === process.argv[3])) {
    const { width, lang, theme, reducedMotion } = test;
    const reduced = reducedMotion === 'reduce';
    const context = await browser.newContext({
      viewport: { width, height: 900 }, colorScheme: theme, reducedMotion,
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(`${BASE}/?lang=${lang}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1, name: lang === 'en' ? 'Omar Borhom' : 'عمر برهم', exact: true }).waitFor();
      await page.locator('.stat-strip').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.stat-card')].every((c) => c.dataset.counterPhase === 'done'), null, { timeout: 15_000 });
      assert.deepEqual(
        await page.locator('.counter-final').allTextContents(),
        await page.locator('.counter-number > .sr-only').allTextContents(),
        'counters must land on their real values',
      );

      for (const id of ['about', 'services', 'projects', 'skills', 'experience', 'education', 'contact']) {
        const heading = page.locator(`#${id} h2 .animated-text`).first();
        await heading.scrollIntoViewIfNeeded();
        await page.waitForFunction((id) => document.querySelector(`#${id} h2 .animated-text`)?.classList.contains('is-visible'), id);
        const names = await heading.evaluate((node) =>
          [...node.querySelectorAll('.motion-word')].map((n) => getComputedStyle(n).animationName),
        );
        assert.ok(names.every((n) => n === (reduced ? 'none' : 'word-enter')), `${id} text motion: ${names}`);
      }

      const seals = page.locator('#experience img[src*="damascus-university.png"]');
      assert.equal(await seals.count(), 2, 'both Faculty entries must show the university seal');
      for (const seal of await seals.all()) {
        await seal.scrollIntoViewIfNeeded();
        await seal.evaluate((image) => image.decode());
        assert.ok(await seal.evaluate((image) => image.complete && image.naturalWidth > 0));
      }
      // Visit every card and paragraph so no reveal can leave content hidden.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((resolve) => setTimeout(resolve, 110));
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      });
      await page.waitForFunction(() => document.querySelectorAll('.reveal:not(.is-visible)').length === 0, null, { timeout: 5000 })
        .catch(() => {});
      assert.equal(await page.locator('.reveal:not(.is-visible)').count(), 0, 'hidden content after scrolling');
      const hiddenText = await page.locator('.animated-text:not(.is-visible):not(.animated-text--rise)').evaluateAll((nodes) => nodes.map((node) => ({
        text: node.querySelector('.sr-only')?.textContent,
        section: node.closest('section')?.id,
      })));
      assert.deepEqual(hiddenText, [], 'hidden text after scrolling');
      assert.ok(await page.locator('.scroll-progress').evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a > 0.98));
      if (lang === 'ar') {
        const joined = await page.locator('h1 .motion-word').allTextContents();
        assert.deepEqual(joined, ['عمر', 'برهم'], 'Arabic words must remain joined');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (reduced) {
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 5000 })
          .catch(() => {});
        assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), 0);
      }

      // Changing language must re-render the text without leaving glyphs hidden.
      await page.locator('header button[lang]').click();
      const nextLang = lang === 'en' ? 'ar' : 'en';
      await page.waitForFunction((nextLang) => document.documentElement.lang === nextLang, nextLang);
      await page.getByRole('heading', { level: 1, name: nextLang === 'en' ? 'Omar Borhom' : 'عمر برهم', exact: true }).waitFor();
      const opener = page.locator('#projects h3 button').first();
      await opener.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      // Reduced motion keeps a short opacity fade for UI state.
      assert.equal(await dialog.evaluate((node) => getComputedStyle(node).animationName), reduced ? 'fade-enter' : 'content-enter');
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0);
      assert.ok(await opener.evaluate((node) => node === document.activeElement), 'focus must return to the project');
      if (!reduced && width === 1440) {
        const card = page.locator('.tilt-card').first();
        await card.hover({ position: { x: 20, y: 20 } });
        await page.waitForFunction((n) => n.style.getPropertyValue('--spot-x') !== '', await card.elementHandle());
        // Tilt eases in over --dur-fast; wait for the transition to settle.
        await card.evaluate((n) => Promise.all(n.getAnimations().map((a) => a.finished)));
        assert.ok(await card.evaluate((node) => !new DOMMatrix(getComputedStyle(node).transform).is2D), 'pointer tilt must create real depth');
        assert.ok(await card.evaluate((node) => node.style.getPropertyValue('--spot-x').length > 0), 'pointer highlight');
        await page.mouse.move(0, 0);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${lang}-${theme}-${width}-${reducedMotion}: text, counters, every section, logos, progress and dialog`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
