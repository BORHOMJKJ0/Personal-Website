import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion`. CSS handles most of the site's motion, but
 * autoplaying video has to be decided in JavaScript — a paused <video> is the
 * only way to honour the preference for it.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
