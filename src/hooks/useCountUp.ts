import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Counts to `to` on entry, on return to the viewport, or on explicit replay.
 *
 * Driven by requestAnimationFrame against a timestamp rather than a fixed
 * step, so the duration holds regardless of frame rate. Under
 * `prefers-reduced-motion` the final value is set immediately — the number is
 * the content, so it must never be withheld.
 */
export function useCountUp(to: number, {
  duration = 2400,
  delay = 0,
  trigger = 0,
}: { duration?: number; delay?: number; trigger?: number } = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const replayRef = useRef<() => void>(() => {});
  const [state, setState] = useState(() => ({
    value: reduced ? to : 0,
    previous: reduced ? to : 0,
    progress: reduced ? 1 : 0,
    playing: false,
    runId: 0,
  }));
  const replay = useCallback(() => replayRef.current(), []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    const cancel = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };

    const finish = () => {
      cancel();
      setState((current) => ({ ...current, previous: current.value, value: to, progress: 1, playing: false }));
    };

    if (
      typeof IntersectionObserver === 'undefined' ||
      reduced
    ) {
      finish();
      return;
    }

    const run = () => {
      if (!visible) return;
      cancel();
      setState((current) => ({ value: 0, previous: 0, progress: 0, playing: true, runId: current.runId + 1 }));
      timer = setTimeout(() => {
        const start = performance.now();
        let lastPaint = start - 70;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 3;
          // Limit React updates; CSS interpolates the digit changes and progress.
          if (now - lastPaint >= 70 || t === 1) {
            setState((current) => ({
              ...current, previous: current.value, value: Math.round(to * eased),
              progress: eased, playing: t < 1,
            }));
            lastPaint = now;
          }
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, delay);
    };
    replayRef.current = run;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5 && !visible) {
            visible = true;
            run();
          } else if (!entry.isIntersecting) {
            visible = false;
            finish();
          }
        }
      },
      { threshold: [0, 0.5] },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancel();
      replayRef.current = () => {};
    };
  }, [to, duration, delay, trigger, reduced]);

  return { ref, ...state, replay } as const;
}
