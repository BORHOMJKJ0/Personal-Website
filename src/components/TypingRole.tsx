import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Types each phrase out, holds it, deletes it, moves to the next — the one
 * piece of continuous motion in the hero.
 *
 * Reduced motion gets the first phrase, static. The element reserves its own
 * height and the longest phrase sets the width via an invisible sizer, so the
 * line never reflows as characters appear.
 */
export function TypingRole({ phrases }: { phrases: string[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced || phrases.length === 0) return;

    const phrase = phrases[index % phrases.length];
    const done = text === phrase;
    const empty = text === '';

    // Hold at the end of a phrase; pause briefly before starting the next.
    const delay = deleting ? 34 : done ? 1700 : 62;

    const timer = setTimeout(() => {
      if (!deleting && done) {
        setDeleting(true);
      } else if (deleting && empty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      } else {
        setText(
          deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1),
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index, phrases, reduced]);

  const longest = phrases.reduce((a, b) => (a.length >= b.length ? a : b), '');

  if (reduced) {
    return <span className="text-accent">{phrases[0]}</span>;
  }

  return (
    <span className="relative inline-grid">
      {/* Sizer: holds the width of the longest phrase so nothing shifts. */}
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {longest}
      </span>
      <span className="col-start-1 row-start-1 text-accent" aria-live="off">
        {text}
        <span
          className="ms-0.5 inline-block w-[0.07em] animate-caret bg-accent align-middle"
          style={{ height: '1em' }}
          aria-hidden="true"
        />
      </span>
      {/* Screen readers get the full list once, not a character at a time. */}
      <span className="sr-only">{phrases.join(', ')}</span>
    </span>
  );
}
