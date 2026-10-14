/** Exercise real motion, Arabic shaping, university logos and keyboard dialogs.
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
      await page.locator('[data-counter]').first().waitFor();
      const samples = [];
      for (let i = 0; i < 18; i++) {
        samples.push(await page.locator('[data-counter]').first().textContent());
        await page.waitForTimeout(80);
      }
      const unique = new Set(samples);
      assert.ok(reduced ? unique.size === 1 : unique.size > 2, `counter did not respect ${reducedMotion}`);
      assert.equal(samples.at(-1), '150+');
      await page.getByRole('heading', { level: 1, name: lang === 'en' ? 'Omar Borhom' : 'عمر برهم', exact: true }).waitFor();
      const firstRole = await page.locator('h1 + p').innerText();
      await page.waitForTimeout(1800);
      const secondRole = await page.locator('h1 + p').innerText();
      assert.ok(reduced ? firstRole === secondRole : firstRole !== secondRole, 'typing preference');

      for (const id of ['about', 'services', 'projects', 'skills', 'experience', 'education', 'contact']) {
        const heading = page.locator(`#${id} h2 .animated-text`).first();
        await heading.scrollIntoViewIfNeeded();
        await page.waitForFunction((id) => document.querySelector(`#${id} h2 .animated-text`)?.classList.contains('is-visible'), id);
        const motion = await heading.evaluate((node) => ({
          playing: node.getAnimations({ subtree: true }).some((a) => a.playState === 'running'),
          names: [...node.querySelectorAll('.motion-letter')].map((n) => getComputedStyle(n).animationName),
        }));
        assert.ok(reduced ? motion.names.every((n) => n === 'none') : motion.playing, `${id} text motion`);
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
      await page.waitForTimeout(1300);
      assert.equal(await page.locator('.reveal:not(.is-visible)').count(), 0, 'hidden content after scrolling');
      const hiddenText = await page.locator('.animated-text:not(.is-visible)').evaluateAll((nodes) => nodes.map((node) => ({
        text: node.querySelector('.sr-only')?.textContent,
        section: node.closest('section')?.id,
      })));
      assert.deepEqual(hiddenText, [], 'hidden text after scrolling');
      assert.ok(await page.locator('.scroll-progress').evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).a > 0.98));
      if (lang === 'ar') {
        const joined = await page.locator('h1 .motion-letter').allTextContents();
        assert.deepEqual(joined, ['عمر', 'برهم'], 'Arabic words must remain joined');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (reduced) {
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
      assert.equal(await dialog.evaluate((node) => getComputedStyle(node).animationName), reduced ? 'none' : 'content-enter');
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0);
      assert.ok(await opener.evaluate((node) => node === document.activeElement), 'focus must return to the project');
      assert.deepEqual(errors, []);
      console.log(`PASS ${lang}-${theme}-${width}-${reducedMotion}: text, counters, every section, logos, progress and dialog`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
