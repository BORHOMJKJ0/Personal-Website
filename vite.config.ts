import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Public assets keep their filenames. Change the portrait URL whenever its
// contents change so a cached placeholder cannot survive a new deployment.
const profilePhotoVersion = createHash('sha256')
  .update(readFileSync(new URL('./public/images/profile.jpg', import.meta.url)))
  .digest('hex')
  .slice(0, 12);

// Faces preloaded by the head script in index.html, per language: whatever
// paints above the fold first (body text and the display name).
const PRELOAD_FONTS = {
  en: ['inter-latin.woff2', 'space-grotesk-latin.woff2'],
  ar: ['plex-arabic-arabic-400.woff2', 'plex-arabic-arabic-700.woff2'],
} as const;

/**
 * Replaces `__FONT_PRELOADS__` in index.html with `{ en: [...], ar: [...] }`.
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
        return html.replace('__FONT_PRELOADS__', JSON.stringify(map));
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
