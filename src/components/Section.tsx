import type { ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

type SectionProps = {
  id: string;
  /** Two-digit index rendered in the rule above the heading. */
  index: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Alternate background, used to separate neighbouring sections. */
  tinted?: boolean;
};

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** The numbered rule that opens every section — the site's signature element. */
export function SectionRule({
  index,
  eyebrow,
}: {
  /** A number is zero-padded to two digits; a string is printed as given. */
  index: number | string;
  eyebrow: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="eyebrow text-accent" dir="ltr" aria-hidden="true">
        {typeof index === 'number' ? String(index).padStart(2, '0') : index}
      </span>
      <span className="eyebrow text-fg-muted">{eyebrow}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}

export function Section({
  id,
  index,
  eyebrow,
  title,
  subtitle,
  children,
  tinted = false,
}: SectionProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-24 border-t border-line py-20 sm:py-28 ${tinted ? 'bg-bg-alt' : ''}`}
    >
      <Container>
        <div ref={ref} className="reveal">
          <SectionRule index={index} eyebrow={eyebrow} />
          <div className="mt-6 max-w-3xl">
            <h2
              id={`${id}-heading`}
              className="text-h2 leading-[1.1] font-semibold text-fg"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-12 sm:mt-14">{children}</div>
      </Container>
    </section>
  );
}
