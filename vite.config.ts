import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { identityImages } from './src/data/identity.ts';

// Public assets keep their filenames. The portrait URLs carry a hash of the
// whole images folder, so a cached old photo cannot survive a new deployment.
const imagesDir = new URL('./public/images/', import.meta.url);
const profilePhotoVersion = (() => {
  const hash = createHash('sha256');
  for (const name of readdirSync(imagesDir).toSorted()) hash.update(name).update(readFileSync(new URL(name, imagesDir)));
  return hash.digest('hex').slice(0, 12);
})();
const { portrait } = identityImages(profilePhotoVersion);

// Faces preloaded by the head script in index.html, per language: whatever
// paints above the fold first (body text and the display name).
const PRELOAD_FONTS = {
  en: ['inter-latin.woff2', 'space-grotesk-latin.woff2'],
  ar: ['plex-arabic-arabic-400.woff2', 'plex-arabic-arabic-700.woff2'],
} as const;

/**
 * Preloads for index.html. Replaces `__FONT_PRELOADS__` with
 * `{ en: [...], ar: [...] }` and adds the hero portrait preload.
 * In a build the URLs are the content-hashed assets emitted for fonts.css, so
 * the preload and the @font-face request are the same cacheable file.
 */
function fontPreloads(): Plugin {
  return {
    name: 'font-preloads',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const resolve = (file: string) => {
          if (!ctx.bundle) return `/src/assets/fonts/${file}`;
          const asset = Object.values(ctx.bundle).find(
            (out) => out.type === 'asset' && out.originalFileNames.some((n) => n.endsWith(`/fonts/${file}`)),
          );
          if (!asset) throw new Error(`font-preloads: ${file} was not emitted`);
          return `/${asset.fileName}`;
        };
        const map = Object.fromEntries(
          Object.entries(PRELOAD_FONTS).map(([lang, files]) => [lang, files.map(resolve)]),
        );
        // The hero portrait is the mobile LCP element, but React renders it, so
        // the browser would find it only after the JS runs. Preload it here.
        const portraitPreload =
          `<link rel="preload" as="image" fetchpriority="high" href="${portrait.src}" ` +
          `imagesrcset="${portrait.srcSet}" imagesizes="${portrait.sizes}" />`;
        return html
          .replace('__FONT_PRELOADS__', JSON.stringify(map))
          .replace('</head>', `    ${portraitPreload}
  </head>`);
      },
    },
  };
}

// The site is served from the root of omar-borhom.vercel.app, so the base is
// always "/". Do not make this configurable: a sub-path base breaks every
// asset URL on Vercel.
export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_PROFILE_PHOTO_VERSION': JSON.stringify(profilePhotoVersion),
  },
  plugins: [react(), tailwindcss(), fontPreloads()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Framework code changes far less often than the content does, so it
        // gets its own long-lived chunk.
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
});
