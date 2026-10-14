import type { CSSProperties } from 'react';
import { useReveal } from '@/hooks/useReveal';

/** Stagger Latin letters and digits, but keep Arabic words joined and readable. */
export function AnimatedText({
  children,
  words = false,
}: {
  children: string;
  words?: boolean;
}) {
  const ref = useReveal<HTMLSpanElement>({ threshold: 0.1 });
  let order = 0;

  return (
    <span ref={ref} className={`animated-text ${words ? 'animated-text--words' : ''}`}>
      {/* Assistive technology reads the complete text once. */}
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" key={children}>
        {/* Keep nonbreaking spaces inside words, including mixed Arabic/Latin prefixes. */}
        {children.split(/([ \t\n]+)/u).map((word, wordIndex) => {
          if (!word.trim()) return word;
          const arabic = /\p{Script=Arabic}/u.test(word);
          const pieces = words || arabic ? [word] : Array.from(word);
          return (
            <span className="motion-word" dir={arabic ? 'rtl' : 'ltr'} key={wordIndex}>
              {pieces.map((piece, pieceIndex) => (
                <span
                  key={pieceIndex}
                  className="motion-letter"
                  style={{
                    '--text-delay': `${Math.min(order++ * (words || arabic ? 65 : 24), 480)}ms`,
                  } as CSSProperties}
                >
                  {piece}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}
