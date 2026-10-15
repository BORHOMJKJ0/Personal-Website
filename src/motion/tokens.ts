/**
 * Motion tokens — the only timing values on the site.
 *
 * CSS reads the same values as custom properties from motion.css; keep the two
 * in step (check-site-motion.mjs compares them against the rendered page).
 * Anything that moves picks a duration, an easing and, if it is a sequence, a
 * multiple of STAGGER from here. Continuous loops are multiples of `hero`.
 */
export const DURATION = {
  /** Hover and press feedback, colour changes. */
  fast: 150,
  /** UI state: menus, dialogs, toggles. */
  base: 300,
  /** Content entering the viewport. */
  slow: 600,
  /** First-load hero choreography and the counter roll. */
  hero: 900,
} as const;

export const EASE = {
  /** Expressive ease-out: quick start, long settle. Default for entrances. */
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Spring-like, with a small overshoot. Pops and presses. */
  spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
  /** Symmetric, for state changes that are not entrances. */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** Delay between consecutive items in a sequence. */
export const STAGGER = 60;

/** Longest delay a stagger may build up, so long lists never lag behind. */
export const STAGGER_MAX = DURATION.slow;

/** Typing line: per-character speeds and the hold on a finished phrase. */
export const TYPING = {
  type: DURATION.fast * 0.4,
  erase: DURATION.fast * 0.2,
  hold: DURATION.hero * 2,
} as const;

/** Stagger delay for item `index`, capped at STAGGER_MAX. */
export function staggerDelay(index: number, step = STAGGER) {
  return Math.min(index * step, STAGGER_MAX);
}
