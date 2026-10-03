import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently nearest the top of the viewport, so
 * the header nav can mark it `aria-current`.
 */
export function useScrollSpy(ids: readonly string[], offset = 120) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      let current: string | null = null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top - offset <= 0) current = id;
      }

      // Near the very bottom the last section wins even if it is short.
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 80;
      if (atBottom) current = ids[ids.length - 1] ?? current;

      setActiveId(current);
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [ids, offset]);

  return activeId;
}
