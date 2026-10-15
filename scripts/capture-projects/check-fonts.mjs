/** Self-hosted fonts: per-language downloads, real rendering and swap shift.
 * node check-fonts.mjs [baseUrl]
 *
 * For each language, on a throttled mobile-class connection:
 *   - no request leaves the origin for fonts (Google Fonts is gone);
 *   - English downloads only Inter + Space Grotesk, Arabic only IBM Plex Sans
 *     Arabic — neither language fetches the other's faces;
 *   - the web faces actually render (document.fonts reports them loaded);
 *   - cumulative layout shift up to load + 2s stays at or under 0.02, which
 *     is what the metric-matched fallbacks exist for.
 */
import assert from 'node:assert/strict';
import { launch } from './lib/pipeline.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const browser = await launch();

const expected = {
  en: { want: ['inter-latin', 'space-grotesk-latin'], forbid: /plex-arabic/ },
  ar: { want: ['plex-arabic-arabic-400', 'plex-arabic-arabic-700'], forbid: /inter-latin|space-grotesk/ },
};

for (const width of [390, 1440]) {
  for (const [lang, rule] of Object.entries(expected)) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    // Slow enough that the fallback faces paint first, so a swap would show.
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const fonts = [];
    page.on('request', (req) => {
      const url = req.url();
      if (req.resourceType() === 'font' || /fonts\.(googleapis|gstatic)/.test(url)) fonts.push(url);
    });

    await page.goto(`${BASE}/?lang=${lang}`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const tag = `${lang}-${width}`;

    assert.ok(fonts.every((u) => u.startsWith(BASE)), `${tag}: third-party font request ${fonts}`);
    for (const name of rule.want) assert.ok(fonts.some((u) => u.includes(name)), `${tag}: ${name} not fetched`);
    assert.ok(!fonts.some((u) => rule.forbid.test(u)), `${tag}: fetched the other language's face: ${fonts}`);

    const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replaceAll('"', '')));
    const family = lang === 'en' ? ['Inter', 'Space Grotesk'] : ['IBM Plex Sans Arabic'];
    for (const f of family) assert.ok(loaded.includes(f), `${tag}: ${f} never rendered (${loaded})`);

    const preloads = await page.evaluate(() => [...document.querySelectorAll('link[rel=preload][as=font]')].map((l) => l.href));
    assert.equal(preloads.length, 2, `${tag}: expected 2 font preloads`);

    const cls = await page.evaluate(() => window.__cls);
    assert.ok(cls <= 0.02, `${tag}: CLS ${cls.toFixed(4)} > 0.02`);

    const names = fonts.map((u) => u.split('/').pop().replace(/-[\w-]{8}\.woff2$/, ''));
    console.log(`PASS ${tag}: CLS ${cls.toFixed(4)}, fonts ${names.join(', ')}`);
    await context.close();
  }
}
await browser.close();
