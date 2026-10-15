import { useEffect, type RefObject } from 'react';
import { useInView } from './useInView';
import { useTabVisible } from './preferences';

/**
 * Pauses every `.motion-loop` inside `ref` while the element is off screen or
 * the tab is hidden, by toggling `data-motion-paused` (see motion.css).
 * Returns whether loops should be running, for JS-driven loops (timers,
 * canvas) to follow the same rule.
 */
export function useLoopPause<T extends HTMLElement>(ref: RefObject<T | null>) {
  const inView = useInView(ref);
  const tabVisible = useTabVisible();
  const running = inView && tabVisible;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.toggleAttribute('data-motion-paused', !running);
  }, [ref, running]);

  return running;
}
