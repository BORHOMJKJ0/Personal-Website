import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Public assets keep their filenames. Change the portrait URL whenever its
// contents change so a cached placeholder cannot survive a new deployment.
const profilePhotoVersion = createHash('sha256')
  .update(readFileSync(new URL('./public/images/profile.jpg', import.meta.url)))
  .digest('hex')
  .slice(0, 12);

// The site is served from the root of omar-borhom.vercel.app, so the base is
// always "/". Do not make this configurable: a sub-path base breaks every
// asset URL on Vercel.
export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_PROFILE_PHOTO_VERSION': JSON.stringify(profilePhotoVersion),
  },
  plugins: [react(), tailwindcss()],
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
