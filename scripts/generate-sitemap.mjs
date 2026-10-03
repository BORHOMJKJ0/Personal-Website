/**
 * Writes public/sitemap.xml and public/robots.txt from the single SITE_URL
 * defined in src/data/site.ts, so changing the domain in one place keeps the
 * canonical tags, hreflang alternates and the sitemap in agreement.
 *
 * Runs automatically on `npm run build` (see the `prebuild` script).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const siteSource = readFileSync(resolve(root, 'src/data/site.ts'), 'utf8');
const match = siteSource.match(/SITE_URL\s*=\s*['"]([^'"]+)['"]/);
if (!match) throw new Error('Could not find SITE_URL in src/data/site.ts');

const siteUrl = match[1].replace(/\/$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const pages = [
  { loc: `${siteUrl}/`, lang: 'en' },
  { loc: `${siteUrl}/?lang=ar`, lang: 'ar' },
];

const alternates = pages
  .map((page) => `      <xhtml:link rel="alternate" hreflang="${page.lang}" href="${page.loc}"/>`)
  .join('\n');

const urls = pages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.lang === 'en' ? '1.0' : '0.9'}</priority>
${alternates}
      <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/>
  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap);
writeFileSync(resolve(root, 'public/robots.txt'), robots);
console.log(`Wrote public/sitemap.xml and public/robots.txt for ${siteUrl}`);
