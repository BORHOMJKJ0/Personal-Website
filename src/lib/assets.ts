/**
 * Builds a URL for a file in /public. The site deploys at the root of its
 * domain, so this just normalises the leading slash — but routing every
 * /public reference through `BASE_URL` keeps the links correct if the deploy
 * base ever changes.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
