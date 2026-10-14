/**
 * Shared plumbing for the asset pipeline: a Chromium instance, screenshot and
 * video capture, and conversion to the formats the site actually serves.
 *
 * Everything here is build-time tooling. None of it ships to the browser.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

export const TOOL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = resolve(TOOL_DIR, '..', '..');
export const PUBLIC_DIR = join(REPO_ROOT, 'public');
export const PROJECTS_DIR = join(PUBLIC_DIR, 'projects');

/** Cards are 16:10; this is the native size every cover is captured at. */
export const COVER = { width: 1280, height: 800 };

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function log(...parts) {
  console.log(...parts);
}

/**
 * Playwright ships its own ffmpeg build. Prefer a system ffmpeg when present
 * (it has the H.264 encoder needed for the mp4 fallback); otherwise fall back
 * to the bundled one, which can still remux/transcode VP8.
 */
export function findFfmpeg() {
  const candidates = ['ffmpeg'];
  // winget installs outside the shell PATH this script usually inherits.
  const winget = join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft/WinGet/Packages',
  );
  if (existsSync(winget)) {
    for (const entry of readdirSync(winget)) {
      if (!entry.startsWith('Gyan.FFmpeg')) continue;
      for (const build of readdirSync(join(winget, entry))) {
        const bin = join(winget, entry, build, 'bin', 'ffmpeg.exe');
        if (existsSync(bin)) candidates.push(bin);
      }
    }
  }
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['-version'], { stdio: 'ignore' });
      return { bin: candidate, system: true };
    } catch {
      /* not on PATH */
    }
  }
  const base = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (existsSync(base)) {
    for (const entry of readdirSync(base)) {
      if (!entry.startsWith('ffmpeg')) continue;
      for (const name of ['ffmpeg-win64.exe', 'ffmpeg-linux', 'ffmpeg-mac']) {
        const bin = join(base, entry, name);
        if (existsSync(bin)) return { bin, system: false };
      }
    }
  }
  return null;
}

/**
 * Playwright pins an exact Chromium revision. If that one is missing but
 * another is already downloaded, use it rather than blocking on a fresh
 * several-hundred-megabyte download.
 */
function chromiumExecutable() {
  const pinned = chromium.executablePath();
  if (existsSync(pinned)) return undefined; // let Playwright use its own

  const base = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (!existsSync(base)) return undefined;
  for (const entry of readdirSync(base)) {
    if (!/^chromium-\d+$/.test(entry)) continue;
    for (const rel of ['chrome-win64/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const bin = join(base, entry, rel);
      if (existsSync(bin)) {
        log(`  (using already-installed ${entry})`);
        return bin;
      }
    }
  }
  return undefined;
}

export async function launch() {
  return chromium.launch({
    executablePath: chromiumExecutable(),
    args: ['--disable-dev-shm-usage', '--force-color-profile=srgb'],
  });
}

/**
 * A page sized for cover captures. `recordVideo` turns on Playwright's video
 * recorder for the whole context, so it is opt-in per capture.
 */
export async function newPage(browser, { recordVideo = null, deviceScaleFactor = 2 } = {}) {
  const context = await browser.newContext({
    viewport: COVER,
    deviceScaleFactor,
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'no-preference',
    ...(recordVideo ? { recordVideo: { dir: recordVideo, size: COVER } } : {}),
  });
  const page = await context.newPage();
  return { context, page };
}

/** Screenshot straight to .webp at the size the card renders. */
export async function shoot(page, outFile, { fullPage = false, quality = 82 } = {}) {
  ensureDir(dirname(outFile));
  const png = await page.screenshot({ fullPage, type: 'png' });
  await sharp(png)
    .resize(COVER.width, fullPage ? null : COVER.height, { fit: 'cover', position: 'top' })
    .webp({ quality, effort: 6 })
    .toFile(outFile);
  log(`    ${relative(outFile)}  ${kb(outFile)}`);
  return outFile;
}

/** Convert an arbitrary image buffer/file to a sized .webp. */
export async function toWebp(input, outFile, { width = COVER.width, height = null, fit = 'cover', quality = 82 } = {}) {
  ensureDir(dirname(outFile));
  await sharp(input)
    .resize(width, height, { fit, position: 'top', withoutEnlargement: false })
    .webp({ quality, effort: 6 })
    .toFile(outFile);
  log(`    ${relative(outFile)}  ${kb(outFile)}`);
  return outFile;
}

/**
 * Record a demo by grabbing frames ourselves and encoding them with the system
 * ffmpeg, rather than using Playwright's recorder.
 *
 * Playwright's recorder needs its own bundled ffmpeg at the exact revision the
 * installed Playwright pins, which is a separate download and a separate thing
 * to break. Driving the frames directly also makes the clip deterministic: the
 * same run always produces the same loop, at a known fps and length.
 *
 * `step(page, i, frames)` positions the UI for frame `i`.
 */
export async function recordFrames(page, outDir, { frames = 150, fps = 25, step }) {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    log('    (no ffmpeg — skipping demo video)');
    return { webm: null, mp4: null };
  }

  const tmp = mkdtempSync(join(tmpdir(), 'frames-'));
  try {
    for (let i = 0; i < frames; i++) {
      await step(page, i, frames);
      await page.screenshot({
        path: join(tmp, `f${String(i).padStart(4, '0')}.png`),
        animations: 'disabled',
      });
    }

    ensureDir(outDir);
    const webm = join(outDir, 'demo.webm');
    const pattern = join(tmp, 'f%04d.png');

    // Raise crf until the clip fits the budget; cards may autoplay several.
    for (const crf of [36, 40, 44, 50]) {
      runFfmpeg(ffmpeg.bin, [
        '-y', '-framerate', String(fps), '-i', pattern,
        '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0',
        '-vf', 'scale=1280:-2', '-pix_fmt', 'yuv420p', '-an',
        '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
        webm,
      ]);
      if (existsSync(webm) && statSync(webm).size <= 1.5 * 1024 * 1024) break;
    }

    let mp4 = join(outDir, 'demo.mp4');
    try {
      runFfmpeg(ffmpeg.bin, [
        '-y', '-framerate', String(fps), '-i', pattern,
        '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1280:-2', '-crf', '30', '-preset', 'slow',
        '-movflags', '+faststart', '-an',
        mp4,
      ]);
    } catch {
      log('    (no H.264 encoder — skipping mp4 fallback)');
      mp4 = null;
    }

    if (existsSync(webm)) log(`    ${relative(webm)}  ${kb(webm)}`);
    if (mp4 && existsSync(mp4)) log(`    ${relative(mp4)}  ${kb(mp4)}`);
    return {
      webm: existsSync(webm) ? webm : null,
      mp4: mp4 && existsSync(mp4) ? mp4 : null,
    };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function runFfmpeg(bin, args) {
  execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

export function relative(file) {
  return file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

export function kb(file) {
  if (!existsSync(file)) return 'missing';
  const bytes = statSync(file).size;
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Serve a directory over HTTP for the duration of one capture. Used for
 * projects that ship a prebuilt frontend, so no build step is needed to
 * screenshot them. Returns `{ url, stop }`.
 */
export async function serveStatic(dir, port = 8099) {
  const { createServer } = await import('node:http');
  const { createReadStream } = await import('node:fs');
  const { stat } = await import('node:fs/promises');
  const { extname, join: joinPath, normalize } = await import('node:path');

  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  };

  const server = createServer(async (req, res) => {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    let file = joinPath(dir, rel);
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = joinPath(file, 'index.html');
      await stat(file);
    } catch {
      file = joinPath(dir, 'index.html'); // SPA fallback
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${port}`,
    stop: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Dismiss cookie banners and other overlays that ruin a clean hero shot. */
export async function dismissOverlays(page) {
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("موافق")',
    '[aria-label*="close" i]',
    '.cookie-banner button',
  ];
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 300 })) await el.click({ timeout: 800 });
    } catch {
      /* nothing to dismiss */
    }
  }
}

/** Stop animations/carousels so repeated runs produce identical frames. */
export async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}`,
  });
  await page.waitForTimeout(250);
}
