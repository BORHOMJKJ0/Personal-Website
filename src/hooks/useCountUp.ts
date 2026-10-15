import { useCallback, useEffect, useRef, useState } from 'react';
import { DURATION, useReducedMotion } from '@/motion';

/**
 * Counter phases. The digits themselves are CSS reels (see Stats.tsx); this
 * hook only decides when they roll:
 *
 *   idle     reels parked at blank/zero, no transition
 *   rolling  reels transition to the target digits
 *   done     reels replaced by plain text, so the number is crisp and every
 *            digit sits on one baseline
 *
 * Rolls on entry, again on each return to the viewport, and on replay. Under
 * `prefers-reduced-motion` it is `done` from the start — the number is the
 * content, so it is never withheld.
 */
export type CounterPhase = 'idle' | 'rolling' | 'done';

export function useCountUp({ delay = 0, trigger = 0 }: { delay?: number; trigger?: number } = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const replayRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<CounterPhase>('idle');
  const [runId, setRunId] = useState(0);
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
      setPhase('done');
    };

    // Reduced motion: the returned phase is forced to `done` below.
    if (typeof IntersectionObserver === 'undefined' || reduced) return;

    const run = () => {
      if (!visible) return;
      cancel();
      setPhase('idle');
      setRunId((id) => id + 1);
      // Two frames: the parked position must paint before the transition
      // starts, or the browser coalesces both and nothing rolls.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          setPhase('rolling');
          // The longest reel (ones place) takes hero + slow; see motion.css.
          timer = setTimeout(finish, delay + DURATION.hero + DURATION.slow);
        });
      });
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
  }, [delay, trigger, reduced]);

  const settled = reduced || typeof IntersectionObserver === 'undefined';
  return { ref, phase: settled ? ('done' as const) : phase, runId, replay } as const;
}
