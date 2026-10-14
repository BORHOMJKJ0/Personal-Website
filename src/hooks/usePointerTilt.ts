import { useEffect, useRef, type PointerEvent } from 'react';

/** Update a card's depth and highlight at most once per frame, without re-renders. */
export function usePointerTilt<T extends HTMLElement>() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return {
    onPointerMove(event: PointerEvent<T>) {
      if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
      const node = event.currentTarget;
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (clientY - box.top) / box.height));
        node.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
        node.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`);
        node.style.setProperty('--spot-x', `${x * 100}%`);
        node.style.setProperty('--spot-y', `${y * 100}%`);
      });
    },
    onPointerLeave(event: PointerEvent<T>) {
      cancelAnimationFrame(frame.current);
      for (const property of ['--tilt-x', '--tilt-y', '--spot-x', '--spot-y']) {
        event.currentTarget.style.removeProperty(property);
      }
    },
  };
}
