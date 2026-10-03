/**
 * Resolves a file in /public against the deploy base path, so links keep
 * working when the site is served from a GitHub Pages subdirectory.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
