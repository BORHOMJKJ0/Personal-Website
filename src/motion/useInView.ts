import { useEffect, useRef, useState, type RefObject } from 'react';

type InViewOptions = {
  threshold?: number;
  rootMargin?: string;
  /** Stop observing after the first entry. */
  once?: boolean;
};

/**
 * Whether an element is on screen. Used to start work on entry and to pause
 * continuous motion (timers, loops, canvas) while it is scrolled away.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { threshold = 0, rootMargin = '0px', once = false }: InViewOptions = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, once]);

  return inView;
}

/**
 * Adds `.is-visible` the first time an element scrolls into view, which drives
 * the CSS reveal in motion.css. No re-render: the class is set directly.
 * Under `prefers-reduced-motion` the element is visible from the start —
 * content is never withheld behind an animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.12,
  rootMargin = '0px 0px -8% 0px',
}: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      node.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
