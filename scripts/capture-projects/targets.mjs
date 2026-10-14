/**
 * One entry per project card on the portfolio.
 *
 * `capture(ctx)` receives helpers from lib/pipeline.mjs and is responsible for
 * writing everything under public/projects/<slug>/. Each target declares how
 * its UI is reached:
 *
 *   live     — a public deployment
 *   local    — a dev server this script starts and stops
 *   template — no runnable UI; an HTML template in templates/ is rendered
 *
 * Targets are intentionally independent: one failing must not stop the rest.
 */
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { TOOL_DIR } from './lib/pipeline.mjs';

const templateUrl = (name) => pathToFileURL(join(TOOL_DIR, 'templates', name)).href;

/**
 * Projects with no runnable UI get a diagram instead of a screenshot. The
 * template is rendered in the same browser so it picks up real fonts, and it
 * is styled to match the portfolio's light palette.
 */
function diagramTarget({ slug, label, template, note }) {
  return {
    slug,
    label,
    mode: 'template',
    note,
    async capture({ page, shoot, outDir, freeze }) {
      await page.goto(templateUrl(template), { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(700); // webfonts
      await freeze(page);
      await shoot(page, join(outDir, 'cover.webp'));
    },
  };
}

/**
 * A demo that loops cleanly: ease down the page, hold, ease back. Because the
 * first and last frames are identical the clip can autoplay on repeat without
 * a visible jump.
 */
export function scrollLoop({ frames = 150, fps = 25, hold = 0.12 } = {}) {
  return {
    frames,
    fps,
    async step(page, i, total) {
      const t = i / (total - 1);
      // Two eased ramps with a hold at the bottom.
      const down = Math.min(1, t / (0.5 - hold / 2));
      const up = Math.max(0, (t - (0.5 + hold / 2)) / (0.5 - hold / 2));
      const raw = t < 0.5 - hold / 2 ? down : t > 0.5 + hold / 2 ? 1 - up : 1;
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2;
      await page.evaluate((p) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * p));
      }, eased);
    },
  };
}

export const targets = [
  {
    slug: 'automata',
    label: 'Automata — Dropbox document automation',
    mode: 'live',
    url: 'https://automata-mu.vercel.app',
    /**
     * The app itself sits behind Dropbox OAuth, so the public surface is the
     * landing page: status, feature list and the connect call to action.
     */
    async capture({ page, shoot, outDir, freeze, scrollTo }) {
      await page.goto('https://automata-mu.vercel.app', {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      await freeze(page);

      await shoot(page, join(outDir, 'cover.webp'));

      await scrollTo(page, 430);
      await shoot(page, join(outDir, 'shot-1.webp'));

      await scrollTo(page, 760);
      await shoot(page, join(outDir, 'shot-2.webp'));

      await scrollTo(page, 0);
    },
    video: scrollLoop({ frames: 150, fps: 25 }),
  },

  {
    slug: 'school-system',
    label: 'School Management System — React frontend',
    mode: 'local',
    /**
     * Run from a clone with VITE_USE_MOCK_API=true. The mock covers auth and a
     * few lists, but the route guard still rejects the mock token, so the
     * dashboard itself is unreachable without the private Laravel backend
     * (`references/backend` is gitignored and ships empty). What is captured
     * is the real sign-in UI: RTL Arabic, the role switch and the reset modal.
     */
    url: 'http://localhost:5173/login',
    async capture({ page, shoot, outDir, freeze }) {
      await page.goto('http://localhost:5173/login', {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      await freeze(page);
      await shoot(page, join(outDir, 'cover.webp'));

      // Role switch — teacher view of the same form.
      await page.getByRole('button', { name: 'أستاذ' }).click().catch(() => {});
      await page.waitForTimeout(500);
      await page.locator('input[type="text"]').first().fill('teacher_01');
      await page.locator('input[type="password"]').first().fill('••••••••••');
      await shoot(page, join(outDir, 'shot-1.webp'));

      // Password reset dialog.
      await page.getByRole('button', { name: 'نسيت كلمة المرور؟' }).click().catch(() => {});
      await page.waitForTimeout(700);
      await shoot(page, join(outDir, 'shot-2.webp'));
    },
    video: {
      frames: 120,
      fps: 24,
      async step(page, i) {
        // Cycle the role tabs and type a username, then loop back.
        if (i === 0) {
          await page.getByRole('button', { name: 'مدير' }).click().catch(() => {});
        } else if (i === 30) {
          await page.getByRole('button', { name: 'أستاذ' }).click().catch(() => {});
        } else if (i > 45 && i <= 75) {
          const typed = 'teacher_01'.slice(0, Math.max(0, i - 45));
          await page.locator('input[type="text"]').first().fill(typed);
        } else if (i === 90) {
          await page.locator('input[type="password"]').first().fill('••••••••');
        } else if (i === 108) {
          await page.locator('input[type="text"]').first().fill('');
          await page.locator('input[type="password"]').first().fill('');
        }
        await page.waitForTimeout(16);
      },
    },
  },

  {
    slug: 'sql-compiler',
    label: 'SQL Compiler — parse tree visualiser',
    mode: 'local',
    /**
     * The project's own HTML visualiser, generated by calling its
     * `create_tree_visualization()` on a short query so the tree fits the
     * frame. Numbers on screen are real analyser output.
     *
     * Produced by scripts/capture-projects/compiler-viz.py (see README).
     */
    url: 'file://.../viz-small.html',
    async capture({ page, shoot, outDir, freeze }) {
      const viz = process.env.COMPILER_VIZ;
      if (!viz) throw new Error('set COMPILER_VIZ to the generated viz HTML path');
      await page.goto(viz, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1800);
      await freeze(page);
      await shoot(page, join(outDir, 'cover.webp'));

      // The AST tab is the second half of what the compiler produces.
      await page.getByText('AST Tree', { exact: false }).first().click().catch(() => {});
      await page.waitForTimeout(1500);
      await shoot(page, join(outDir, 'shot-1.webp'));
    },
  },

  {
    slug: 'baraa',
    label: 'Baraa — Laravel API (Swagger UI)',
    mode: 'local',
    /**
     * Backend-only project, so the visual is its own generated API reference.
     * Run from a clone inside a PHP 8.2 container (Laravel 10 does not support
     * the host's PHP 8.5), with MySQL swapped for SQLite:
     *
     *   docker run --rm -v "$PWD:/app" -w /app php:8.2-cli composer install
     *   php artisan key:generate && php artisan jwt:secret
     *   php artisan migrate --force && php artisan db:seed --force
     *   php artisan l5-swagger:generate
     *   php artisan serve --host 0.0.0.0 --port 8000
     *
     * Set BARAA_URL to the served origin.
     */
    async capture({ page, shoot, outDir, freeze }) {
      const base = process.env.BARAA_URL;
      if (!base) throw new Error('set BARAA_URL to the running Laravel server');

      await page.goto(`${base}/api/documentation`, {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      await page.waitForSelector('.opblock-tag', { timeout: 30_000 });
      await page.waitForTimeout(1200);
      await freeze(page);
      await shoot(page, join(outDir, 'cover.webp'));

      // Expand the Products group, then one endpoint, to show real schemas.
      await page.locator('.opblock-tag').filter({ hasText: 'Products' }).first().click();
      await page.waitForTimeout(900);
      await shoot(page, join(outDir, 'shot-1.webp'));

      await page.locator('.opblock').first().click();
      await page.waitForTimeout(1100);
      await shoot(page, join(outDir, 'shot-2.webp'));
    },
    video: {
      frames: 140,
      fps: 24,
      async step(page, i) {
        if (i === 10) {
          await page.locator('.opblock-tag').filter({ hasText: 'User' }).first().click().catch(() => {});
        } else if (i === 55) {
          await page.locator('.opblock').first().click().catch(() => {});
        } else if (i === 100) {
          await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'instant' }));
        } else if (i === 125) {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        }
        await page.waitForTimeout(16);
      },
    },
  },

  {
    slug: 'fp-ucp',
    label: 'Software Project Estimation Assistant',
    mode: 'local',
    /**
     * The repo ships a prebuilt frontend (frontend/build), so it is served
     * statically rather than rebuilt. The estimator itself calls OpenRouter,
     * which needs the visitor's own API key, so what is captured is the setup
     * screen and the estimator UI rather than a generated report.
     *
     * Point FPUCP_BUILD at a clone's frontend/build directory.
     */
    async start() {
      const dir = process.env.FPUCP_BUILD;
      if (!dir) throw new Error('set FPUCP_BUILD to a clone of frontend/build');
      const { serveStatic } = await import('./lib/pipeline.mjs');
      const server = await serveStatic(dir, 8099);
      this.url = server.url;
      return server.stop;
    },
    async capture({ page, shoot, outDir, freeze }) {
      await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(900);
      await freeze(page);
      await shoot(page, join(outDir, 'cover.webp'));

      // Open the estimator; without a key it stops at the setup prompt.
      await page.getByRole('button', { name: /ابدأ التقدير/ }).click().catch(() => {});
      await page.waitForTimeout(1200);
      await shoot(page, join(outDir, 'shot-1.webp'));
    },
  },

  diagramTarget({
    slug: 'mini-nn',
    label: 'JKJMiniNN — library overview and test run',
    template: 'mini-nn.html',
    note: 'Python library with no UI; terminal panel reproduces a real `tests/run_all_tests.py` run (4/4 passing).',
  }),

  diagramTarget({
    slug: 'stock-prediction',
    label: 'Stock Price Trend Prediction — ensemble diagram',
    template: 'stock-prediction.html',
    note: 'Jupyter-notebook project with no UI; diagram built from the CV and repo README.',
  }),

  diagramTarget({
    slug: 'trip-platform',
    label: 'Trip Ride-Sharing Platform — architecture diagram',
    template: 'trip-platform.html',
    note: 'Private client project, no source access; diagram built from the CV only.',
  }),
];

export function findTarget(slug) {
  return targets.find((t) => t.slug === slug);
}
