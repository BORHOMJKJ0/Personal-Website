/**
 * Scratch helper: open a target and report its routes, headings and clickable
 * nav so the capture plan for it can be written against what is really there.
 *
 *   node explore.mjs https://automata-mu.vercel.app
 */
import { launch, newPage, dismissOverlays } from './lib/pipeline.mjs';

const url = process.argv[2];
if (!url) throw new Error('usage: node explore.mjs <url>');

const browser = await launch();
const { context, page } = await newPage(browser);

const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 90)}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
await dismissOverlays(page);

const info = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  lang: document.documentElement.lang,
  dir: document.documentElement.dir || getComputedStyle(document.body).direction,
  headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 12).map((h) => h.textContent.trim().slice(0, 60)),
  links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))]
    .filter((h) => h && !h.startsWith('http') && !h.startsWith('#') && !h.startsWith('mailto'))
    .slice(0, 25),
  buttons: [...document.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 15),
  forms: document.querySelectorAll('form').length,
  inputs: [...document.querySelectorAll('input,select')].map((i) => i.getAttribute('name') || i.getAttribute('type')).slice(0, 10),
  bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
}));

console.log(JSON.stringify(info, null, 1));
if (errors.length) console.log('\nissues:', errors.slice(0, 8));

await context.close();
await browser.close();
