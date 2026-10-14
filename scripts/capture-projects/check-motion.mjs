/**
 * Verify the motion features actually run, and that reduced-motion really
 * turns them off. Screenshots are taken with reduced motion on, so this is the
 * only pass that exercises the animated paths.
 */
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await launch();

async function open(reducedMotion) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  return { context, page };
}

/** Load afresh and poll the first counter while it animates. */
async function sampleCounter(reducedMotion) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('[data-counter]', { timeout: 20_000 });
  const samples = [];
  for (let i = 0; i < 26; i++) {
    samples.push(await page.evaluate(() => document.querySelector('[data-counter]')?.textContent ?? '-'));
    await page.waitForTimeout(70);
  }
  await context.close();
  const unique = [...new Set(samples)];
  return unique.length > 2
    ? `counting up — ${unique.slice(0, 8).join(' → ')}`
    : `instant — ${unique.join(' → ')}`;
}

for (const reducedMotion of ['no-preference', 'reduce']) {
  const { context, page } = await open(reducedMotion);
  console.log(`\n── prefers-reduced-motion: ${reducedMotion} ──`);

  // Floating hero ornament
  console.log(
    '  floating chips:',
    await page.evaluate(() => {
      const layer = document.querySelector('.float-layer');
      if (!layer) return 'missing';
      const hidden = getComputedStyle(layer).display === 'none';
      const chip = document.querySelector('.float-chip');
      const anim = chip ? getComputedStyle(chip).animationName : 'none';
      return hidden ? 'hidden (correct for reduce)' : `visible, animation=${anim}`;
    }),
  );

  // Typing effect: sample the role line twice and see whether it changed.
  const first = await page.locator('h1 + p').first().innerText();
  await page.waitForTimeout(1600);
  const second = await page.locator('h1 + p').first().innerText();
  console.log(
    '  typing role:',
    first === second ? `static ("${first.trim().slice(0, 40)}")` : 'animating',
  );

  // Counters have to be sampled from first paint — by the time the page is
  // network-idle the animation has already finished.
  const counter = await sampleCounter(reducedMotion);
  console.log(`  counters: ${counter}`);

  // Card demo video on hover.
  const card = page.locator('#projects li.group').filter({ hasText: 'Automata' }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(1600);
  console.log(
    '  hover demo video:',
    await page.evaluate(() => {
      const v = document.querySelector('#projects video');
      if (!v) return 'no video element (correct for reduce)';
      return `paused=${v.paused} currentTime=${v.currentTime.toFixed(2)} playing=${v.classList.contains('is-playing')}`;
    }),
  );

  await context.close();
}

await browser.close();
