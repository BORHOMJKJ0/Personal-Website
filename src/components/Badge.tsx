import type { ReactNode } from 'react';

/**
 * Mono chip used for tech names. Technology names are product names, so they
 * stay in English (and therefore LTR) even inside an RTL page — `dir="ltr"`
 * stops the bidi algorithm from reordering things like "Laravel 10".
 */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      dir="ltr"
      className="eyebrow inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1 text-fg-muted"
    >
      {children}
    </span>
  );
}
