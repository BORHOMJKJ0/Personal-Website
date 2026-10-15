/**
 * The portrait, in every size the site draws it. The single place its paths
 * live: React reads it through profile.ts, and vite.config.ts reads it to
 * preload the hero portrait from the HTML.
 *
 * Every file is generated from public/images/profile.jpg (never edited) by
 * scripts/capture-projects/identity.mjs. `version` is a hash of the images
 * folder, so a new photo can never be served from a stale cache.
 *
 * Pure module: no import.meta, no React — vite.config.ts imports it.
 */
const imagesDir = 'images';

export type ResponsiveImage = {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
};

export function identityImages(version: string, url: (path: string) => string = (p) => `/${p}`) {
  const file = (name: string) => url(`${imagesDir}/${name}?v=${version}`);

  /** Hero portrait: 144 / 176 / 208 CSS px (mobile / sm / lg), shown as a circle. */
  const portrait: ResponsiveImage = {
    src: file('profile.jpg'),
    srcSet: `${file('profile-320.webp')} 320w, ${file('profile-480.webp')} 480w, ${file('profile.jpg')} 680w`,
    sizes: '(min-width: 1024px) 208px, (min-width: 640px) 176px, 144px',
    width: 680,
    height: 680,
  };

  /** Face crop for the small circular avatars (navbar, footer). */
  const face = (cssPx: number): ResponsiveImage => ({
    src: file('profile-face.jpg'),
    srcSet: `${file('profile-face-64.webp')} 64w, ${file('profile-face-128.webp')} 128w, ${file('profile-face.jpg')} 256w`,
    sizes: `${cssPx}px`,
    width: 256,
    height: 256,
  });

  return { portrait, face };
}
