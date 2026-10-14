/**
 * Logos for the organisations named in the CV.
 *
 * `file` points at /public/logos. Where no official logo could be sourced, the
 * entry carries `initials` instead and the Logo component draws a badge.
 *
 * Sourcing notes:
 *   damascus-university — en.wikipedia.org/wiki/File:Damascus_University.png
 *                         (the official seal; the university's own site is not
 *                         reachable from here)
 *   maps                — official mark supplied by the site owner.
 *   faculty, trip, union — no public brand mark; initials by design.
 */
export type Org = {
  id: string;
  /** Path under /public, or null to fall back to an initials badge. */
  file: string | null;
  /** Latin initials for the badge fallback. Kept short. */
  initials: string;
};

const LOGO_ROOT = 'logos';

export const orgs: Record<string, Org> = {
  'damascus-university': {
    id: 'damascus-university',
    file: `${LOGO_ROOT}/damascus-university.png`,
    initials: 'DU',
  },
  maps: {
    id: 'maps',
    file: `${LOGO_ROOT}/maps.png`,
    initials: 'M',
  },
  faculty: {
    id: 'faculty',
    file: null,
    initials: 'IT',
  },
  union: {
    id: 'union',
    file: null,
    initials: 'SU',
  },
  trip: {
    id: 'trip',
    file: null,
    initials: 'T',
  },
};

export function getOrg(id: string | undefined): Org | null {
  return id ? (orgs[id] ?? null) : null;
}
