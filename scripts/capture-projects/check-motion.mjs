/**
 * Motion system check: every animated path runs in normal mode, and is off
 * (or reduced to a short fade) under prefers-reduced-motion.
 *
 *   node check-motion.mjs [baseUrl] [screenshotDir]
 *
 * Runs EN/AR × 390/1440 × no-preference/reduce. No retries and no
 * sample-and-hope sleeps: each assertion waits for an observable condition
 * (data-counter-phase, data-motion-paused, a text change). The only fixed
 * waits are the windows in which something must NOT change.
 *
 * Covers: token parity (CSS vs tokens.ts), hero name opaque at first paint,
 * typing (runs, pauses off screen / hidden tab, static when reduced), hero
 * loop pausing, counter roll + exact values + one baseline + all replay paths
 * + live switch to reduced motion, word-level headings, hover/touch demo
 * video, pointer tilt (and its reset when reduced motion turns on).
 */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const SHOTS = process.argv[3] ?? null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');
const tokensSource = readFileSync(join(repo, 'src/motion/tokens.ts'), 'utf8');
const token = (name) => Number(new RegExp(`${name}: (\\d+)`).exec(tokensSource)[1]);
const TOKENS = {
  '--dur-fast': `${token('fast')}ms`,
  '--dur-base': `${token('base')}ms`,
  '--dur-slow': `${token('slow')}ms`,
  '--dur-hero': `${token('hero')}ms`,
  '--stagger': `${Number(/export const STAGGER = (\d+)/.exec(tokensSource)[1])}ms`,
};
const HOLD = token('hero') * 2; // TYPING.hold
const phrases = {
  en: JSON.parse(readFileSync(join(repo, 'src/i18n/locales/en.json'), 'utf8')).hero.typingPhrases,
  ar: JSON.parse(readFileSync(join(repo, 'src/i18n/locales/ar.json'), 'utf8')).hero.typingPhrases,
};

const browser = await launch();
const cases = [390, 1440].flatMap((width) =>
  ['en', 'ar'].flatMap((lang) => ['no-preference', 'reduce'].map((reducedMotion) => ({ width, lang, reducedMotion }))),
);
const only = process.argv[4];

const phases = (page) => page.locator('.stat-card').evaluateAll((cards) => cards.map((c) => c.dataset.counterPhase));
const runs = (page) => page.locator('.stat-card').evaluateAll((cards) => cards.map((c) => Number(c.dataset.counterRun)));
const allPhase = (page, phase) =>
  page.waitForFunction((phase) => [...document.querySelectorAll('.stat-card')].every((c) => c.dataset.counterPhase === phase), phase);
const runsAbove = (page, previous) =>
  page.waitForFunction(
    (previous) => [...document.querySelectorAll('.stat-card')].every((c, i) => Number(c.dataset.counterRun) > previous[i]),
    previous,
  );

try {
  for (const { width, lang, reducedMotion } of cases) {
    const tag = `${lang}-${width}-${reducedMotion}`;
    if (only && only !== tag) continue;
    const reduced = reducedMotion === 'reduce';
    const desktop = width >= 1024;
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: !desktop,
      hasTouch: !desktop,
      reducedMotion,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    // Record the hero name's effective opacity on the first frame it exists.
    await page.addInitScript(() => {
      const tick = () => {
        const words = document.querySelectorAll('h1 .motion-word');
        if (!words.length) return requestAnimationFrame(tick);
        window.__nameFirstFrame = [...words].map((word) => {
          let opacity = 1;
          for (let n = word; n && n.nodeType === 1; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
          return { text: word.textContent, opacity };
        });
      };
      requestAnimationFrame(tick);
    });

    try {
      await page.goto(`${BASE}/?lang=${lang}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__nameFirstFrame);

      // Tokens: CSS custom properties match tokens.ts.
      const css = await page.evaluate((names) => {
        const style = getComputedStyle(document.documentElement);
        // The minifier may write 150ms as .15s; compare in milliseconds.
        const ms = (v) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
        return Object.fromEntries(names.map((n) => [n, `${Math.round(ms(style.getPropertyValue(n).trim()))}ms`]));
      }, Object.keys(TOKENS));
      assert.deepEqual(css, TOKENS, `${tag}: motion.css tokens drifted from tokens.ts`);

      // Name: fully opaque on its first frame, Arabic words whole.
      const name = await page.evaluate(() => window.__nameFirstFrame);
      assert.ok(name.every((w) => w.opacity === 1), `${tag}: name not opaque at first paint ${JSON.stringify(name)}`);
      assert.deepEqual(name.map((w) => w.text), lang === 'en' ? ['Omar', 'Borhom'] : ['عمر', 'برهم']);

      // Typing.
      if (reduced) {
        assert.equal(await page.locator('[data-typing]').count(), 0, `${tag}: typing ran under reduced motion`);
        assert.equal((await page.locator('h1 + p').innerText()).trim(), phrases[lang][0]);
      } else {
        const typing = page.locator('[data-typing]');
        const t0 = await typing.textContent();
        await page.waitForFunction((t0) => document.querySelector('[data-typing]').textContent !== t0, t0, { timeout: HOLD * 3 });
        const sr = await page.locator('h1 + p .sr-only').textContent();
        assert.equal(sr, phrases[lang].join(', '), `${tag}: typing phrases`);
      }

      // Hero loops: running in view, paused off screen and in a hidden tab.
      const loopStates = () =>
        page.evaluate(() =>
          [...document.querySelectorAll('#top .motion-loop')].flatMap((n) => n.getAnimations({ subtree: true }).map((a) => a.playState)),
        );
      if (reduced) {
        assert.ok((await loopStates()).every((s) => s !== 'running'), `${tag}: loop running under reduced motion`);
      } else {
        await page.waitForFunction(() => !document.querySelector('#top').hasAttribute('data-motion-paused'));
        assert.ok((await loopStates()).includes('running'), `${tag}: hero loops not running`);

        await page.locator('#contact').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('#top').hasAttribute('data-motion-paused'));
        assert.ok((await loopStates()).every((s) => s === 'paused'), `${tag}: loops still running off screen`);
        const frozen = await page.locator('[data-typing]').textContent();
        await page.waitForTimeout(HOLD + 600); // window in which typing must not move
        assert.equal(await page.locator('[data-typing]').textContent(), frozen, `${tag}: typing ran off screen`);

        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => !document.querySelector('#top').hasAttribute('data-motion-paused'));
        await page.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => document.querySelector('#top').hasAttribute('data-motion-paused'));
        assert.ok((await loopStates()).every((s) => s === 'paused'), `${tag}: loops running in a hidden tab`);
        await page.evaluate(() => {
          delete document.visibilityState;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => !document.querySelector('#top').hasAttribute('data-motion-paused'));
      }

      // Counters.
      const strip = page.locator('.stat-strip');
      const finals = () => page.locator('.counter-number').evaluateAll((nodes) =>
        nodes.map((n) => [n.querySelector('.counter-final')?.textContent ?? null, n.querySelector('.sr-only').textContent]),
      );
      if (reduced) {
        await strip.scrollIntoViewIfNeeded();
        assert.ok((await phases(page)).every((p) => p === 'done'), `${tag}: counters not final`);
        assert.equal(await page.locator('.counter-reels').count(), 0);
        assert.equal(await page.locator('.stats-replay').count(), 0);
      } else {
        await strip.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForFunction(() => document.querySelector('.stat-card')?.dataset.counterPhase === 'rolling');
        // Sample the ones reel of the first counter for a few frames, in page.
        const ys = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const strip = document.querySelector('.stat-card .counter-strip--ones');
              const out = [];
              const start = performance.now();
              const tick = (now) => {
                if (strip.isConnected) out.push(new DOMMatrix(getComputedStyle(strip).transform).f);
                if (now - start < 500) requestAnimationFrame(tick);
                else resolve(out);
              };
              requestAnimationFrame(tick);
            }),
        );
        const distinct = [...new Set(ys.map((y) => y.toFixed(1)))];
        assert.ok(distinct.length >= 3, `${tag}: counter did not roll (${distinct.join(', ')})`);
        assert.ok(ys.every((y, i) => i === 0 || y <= ys[i - 1] + 0.01), `${tag}: roll must move one way`);
        // While rolling, reels and suffix share one line box.
        const boxes = await page.locator('.stat-card').first().evaluate((card) =>
          [...card.querySelectorAll('.counter-reel, .counter-suffix')].map((n) => {
            const r = n.getBoundingClientRect();
            return [Math.round(r.top * 10) / 10, Math.round(r.height * 10) / 10];
          }),
        );
        assert.ok(boxes.every(([top, h]) => top === boxes[0][0] && h === boxes[0][1]), `${tag}: reels misaligned ${JSON.stringify(boxes)}`);
        if (SHOTS) await strip.screenshot({ path: join(SHOTS, `${tag}-counters-rolling.png`) });
        await allPhase(page, 'done');
        if (SHOTS) await strip.screenshot({ path: join(SHOTS, `${tag}-counters-done.png`) });

        // Replay: button, hover (desktop), leaving and returning.
        let previous = await runs(page);
        await page.locator('.stats-replay').click();
        await runsAbove(page, previous);
        await allPhase(page, 'done');
        if (desktop) {
          previous = await runs(page);
          await page.locator('.stat-card').first().hover();
          await page.waitForFunction((r) => Number(document.querySelector('.stat-card').dataset.counterRun) > r, previous[0]);
          await page.mouse.move(0, 0);
          await allPhase(page, 'done');
        }
        previous = await runs(page);
        await page.locator('#contact').scrollIntoViewIfNeeded();
        await allPhase(page, 'done');
        await strip.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await runsAbove(page, previous);

        // Reduced motion switched on mid-roll: final values at once.
        await page.waitForFunction(() => document.querySelector('.stat-card').dataset.counterPhase === 'rolling');
        const t = Date.now();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await allPhase(page, 'done');
        assert.ok(Date.now() - t < 500, `${tag}: reduced motion did not settle counters immediately`);
        assert.equal(await page.locator('.stats-replay').count(), 0);
        // Turning it off again re-rolls the visible counters; let them land.
        previous = await runs(page);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await runsAbove(page, previous);
        await allPhase(page, 'done');
      }
      const values = await finals();
      assert.ok(values.every(([shown, final]) => shown === final), `${tag}: counter values ${JSON.stringify(values)}`);
      // Settled numbers: every glyph on one baseline (identical glyph boxes' bottoms).
      const bottoms = await page.locator('.counter-final').evaluateAll((nodes) =>
        nodes.map((n) => {
          const range = document.createRange();
          const text = n.firstChild;
          return [...n.textContent].map((_, i) => {
            range.setStart(text, i);
            range.setEnd(text, i + 1);
            return Math.round(range.getBoundingClientRect().bottom * 10) / 10;
          });
        }),
      );
      assert.ok(bottoms.every((b) => b.every((v) => v === b[0])), `${tag}: digits off baseline ${JSON.stringify(bottoms)}`);

      // Headings: word-level, no letters.
      assert.equal(await page.locator('.motion-letter').count(), 0, `${tag}: letter-level text remains`);
      const heading = page.locator('#about h2 .animated-text');
      await heading.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#about h2 .animated-text').classList.contains('is-visible'));
      const words = await heading.evaluate((n) =>
        [...n.querySelectorAll('.motion-word')].map((w) => [getComputedStyle(w).animationName, getComputedStyle(w).opacity]),
      );
      if (reduced) assert.ok(words.every(([anim, op]) => anim === 'none' && op === '1'), `${tag}: heading animated under reduce`);
      else assert.ok(words.every(([anim]) => anim === 'word-enter'), `${tag}: heading words not animating ${JSON.stringify(words)}`);

      // Demo video: hover on desktop, on-screen on touch, never when reduced.
      const demoCard = page.locator('#projects li[data-project="automata"]');
      await demoCard.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
      if (desktop) await demoCard.hover();
      if (reduced) {
        await page.waitForTimeout(800); // window in which no video may appear
        assert.equal(await demoCard.locator('video').count(), 0, `${tag}: demo video under reduced motion`);
      } else {
        await demoCard.locator('video.is-playing').waitFor({ timeout: 10_000 });
        if (desktop) {
          await page.mouse.move(0, 0);
          await demoCard.locator('video').waitFor({ state: 'detached' });
        }
      }

      // Pointer tilt: real depth on hover, cleared the moment reduced motion turns on.
      if (desktop && !reduced) {
        const card = page.locator('.tilt-card').first();
        await card.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await card.hover({ position: { x: 24, y: 24 } });
        await page.waitForFunction((n) => n.style.getPropertyValue('--spot-x') !== '', await card.elementHandle());
        assert.ok(await card.evaluate((n) => !new DOMMatrix(getComputedStyle(n).transform).is2D), `${tag}: no tilt depth`);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction((n) => n.style.getPropertyValue('--spot-x') === '', await card.elementHandle());
        assert.equal(await card.evaluate((n) => getComputedStyle(n).transform), 'none', `${tag}: tilt survived reduced motion`);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.mouse.move(0, 0);
      }

      // Reduced motion: once the page has been scrolled, nothing is running.
      if (reduced) {
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
      }

      assert.deepEqual(errors, [], `${tag}: page errors`);
      console.log(`PASS ${tag}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
