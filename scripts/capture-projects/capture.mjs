/**
 * Capture project media into public/projects/<slug>/.
 *
 *   npm run capture              # every target
 *   npm run capture -- automata  # one target
 *
 * Each target is isolated: a failure is reported and the run continues, so one
 * project that will not boot never blocks the others.
 */
import { join } from 'node:path';
import {
  PROJECTS_DIR,
  ensureDir,
  freeze,
  launch,
  log,
  newPage,
  recordFrames,
  relative,
  shoot,
} from './lib/pipeline.mjs';
import { targets } from './targets.mjs';

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const selected = only.length ? targets.filter((t) => only.includes(t.slug)) : targets;

if (!selected.length) {
  console.error(`No matching target. Known: ${targets.map((t) => t.slug).join(', ')}`);
  process.exit(1);
}

/** Smooth scroll to an absolute offset, then settle. */
async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(350);
}

const results = [];
const browser = await launch();

for (const target of selected) {
  const outDir = ensureDir(join(PROJECTS_DIR, target.slug));
  log(`\n▶ ${target.slug} — ${target.label}`);
  const result = { slug: target.slug, label: target.label, files: [], error: null };

  let teardown = null;
  try {
    if (target.start) {
      log('  starting local server…');
      teardown = await target.start();
    }

    const { context, page } = await newPage(browser, { deviceScaleFactor: 1 });
    page.on('pageerror', (e) => log(`    ! page error: ${String(e).slice(0, 90)}`));

    await target.capture({
      page,
      outDir,
      shoot: async (p, file, opts) => {
        const out = await shoot(p, file, opts);
        result.files.push(relative(out));
        return out;
      },
      freeze,
      scrollTo,
      log,
    });
    await context.close();

    if (target.video) {
      log('  recording demo…');
      const { context: vctx, page: vpage } = await newPage(browser, { deviceScaleFactor: 1 });
      // Re-walk the UI to the starting state, writing no stills this time.
      await target.capture({
        page: vpage,
        outDir,
        shoot: async () => {},
        freeze: target.video.keepMotion ? async () => {} : freeze,
        scrollTo,
        log,
      });
      const { webm, mp4 } = await recordFrames(vpage, outDir, target.video);
      await vctx.close();
      if (webm) result.files.push(relative(webm));
      if (mp4) result.files.push(relative(mp4));
      result.video = Boolean(webm);
    }
  } catch (error) {
    result.error = error.message.split('\n')[0];
    log(`  ✗ ${result.error}`);
  } finally {
    if (teardown) await teardown().catch(() => {});
  }

  results.push(result);
}

await browser.close();

log('\n── summary ──');
for (const r of results) {
  log(`${r.error ? '✗' : '✓'} ${r.slug.padEnd(18)} ${r.error ?? `${r.files.length} files`}`);
}

const failed = results.filter((r) => r.error);
process.exit(failed.length === results.length ? 1 : 0);
