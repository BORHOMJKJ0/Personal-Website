import { useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';
/** A real mouse or trackpad. Touch screens, pens and TV remotes fail this. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

const subscribers = new Map<string, (onChange: () => void) => () => void>();

/** Live value of a media query; re-renders when it flips. */
export function useMediaQuery(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = subscribeQuery(query);
    subscribers.set(query, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * `prefers-reduced-motion`. CSS handles most of the site's motion; JavaScript
 * needs it for timers, video and canvas, which CSS cannot stop.
 */
export function useReducedMotion() {
  return useMediaQuery(REDUCED);
}

/** True with a precise hovering pointer — the gate for every pointer effect. */
export function useFinePointer() {
  return useMediaQuery(FINE_POINTER);
}

/** Touch-first device: no hover, no tilt, no parallax, lighter backgrounds. */
export function useIsTouch() {
  return !useFinePointer();
}

/** Synchronous checks for event handlers that must not wait for a render. */
export const prefersReducedMotion = () => window.matchMedia(REDUCED).matches;
export const hasFinePointer = () => window.matchMedia(FINE_POINTER).matches;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/** False while the tab is in the background; continuous motion stops then. */
export function useTabVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  );
}
