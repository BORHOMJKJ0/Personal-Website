import { useEffect, useRef, type PointerEvent } from 'react';
import { hasFinePointer, prefersReducedMotion } from './preferences';

const VARS = ['--tilt-x', '--tilt-y', '--spot-x', '--spot-y'] as const;

/**
 * Pointer position over an element, written as CSS custom properties at most
 * once per frame and without re-rendering:
 *
 *   --spot-x / --spot-y   pointer position, 0%–100% of the box
 *   --tilt-x / --tilt-y   rotation toward the pointer, ±`tilt` degrees
 *
 * Mouse only, and never under reduced motion. If reduced motion is switched
 * on while the pointer rests on the element, the values clear immediately
 * rather than at the next pointer event.
 */
export function usePointer<T extends HTMLElement>({ tilt = 7 }: { tilt?: number } = {}) {
  const frame = useRef(0);
  const active = useRef<T | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      if (query.matches && active.current) clear(active.current);
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return {
    onPointerMove(event: PointerEvent<T>) {
      if (event.pointerType !== 'mouse' || prefersReducedMotion() || !hasFinePointer()) return;
      const node = event.currentTarget;
      const { clientX, clientY } = event;
      active.current = node;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (clientY - box.top) / box.height));
        node.style.setProperty('--tilt-x', `${(0.5 - y) * tilt}deg`);
        node.style.setProperty('--tilt-y', `${(x - 0.5) * tilt}deg`);
        node.style.setProperty('--spot-x', `${x * 100}%`);
        node.style.setProperty('--spot-y', `${y * 100}%`);
      });
    },
    onPointerLeave(event: PointerEvent<T>) {
      cancelAnimationFrame(frame.current);
      active.current = null;
      clear(event.currentTarget);
    },
  };
}

function clear(node: HTMLElement) {
  for (const name of VARS) node.style.removeProperty(name);
}
