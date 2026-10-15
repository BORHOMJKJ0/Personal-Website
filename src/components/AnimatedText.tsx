import type { CSSProperties } from 'react';
import { STAGGER, staggerDelay, useReveal } from '@/motion';

/**
 * Word-by-word entrance for headings and short labels.
 *
 * Words rise and fade in, staggered by the motion token, the first time the
 * text scrolls into view. Splitting is by whitespace only, so Arabic words
 * stay whole and joined; non-breaking spaces stay inside their word, which
 * keeps mixed Arabic/Latin prefixes on one line.
 *
 * `rise` is for the hero name: the words start moving on first render and are
 * fully opaque from the first frame — it must never fade in from nothing.
 */
export function AnimatedText({ children, rise = false }: { children: string; rise?: boolean }) {
  const ref = useReveal<HTMLSpanElement>({ threshold: 0.1 });
  let order = 0;

  return (
    <span
      ref={rise ? undefined : ref}
      className={rise ? 'animated-text animated-text--rise' : 'animated-text'}
    >
      {/* Assistive technology reads the complete text once. */}
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" key={children}>
        {children.split(/([ \t\n]+)/u).map((word, index) => {
          if (!word.trim()) return word;
          const arabic = /\p{Script=Arabic}/u.test(word);
          return (
            <span
              className="motion-word"
              dir={arabic ? 'rtl' : 'ltr'}
              key={index}
              style={{ '--word-delay': `${staggerDelay(order++, STAGGER)}ms` } as CSSProperties}
            >
              {word}
            </span>
          );
        })}
      </span>
    </span>
  );
}
