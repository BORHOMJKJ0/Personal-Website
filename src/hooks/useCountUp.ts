import { useEffect, useRef, useState } from 'react';

/**
 * Counts from 0 to `to` the first time the element scrolls into view, once per
 * page load.
 *
 * Driven by requestAnimationFrame against a timestamp rather than a fixed
 * step, so the duration holds regardless of frame rate. Under
 * `prefers-reduced-motion` the final value is set immediately — the number is
 * the content, so it must never be withheld.
 */
export function useCountUp(to: number, { duration = 1400 }: { duration?: number } = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started.current) return;

    const finish = () => {
      started.current = true;
      setValue(to);
    };

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finish();
      return;
    }

    let frame = 0;
    const run = () => {
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutExpo: fast at first, settles precisely on the target.
        const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t);
        setValue(Math.round(to * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return { ref, value } as const;
}
