import { useTranslation } from 'react-i18next';
import type { CSSProperties } from 'react';
import { Logo } from './Logo';
import { Section } from './Section';
import { AnimatedText } from './AnimatedText';
import { staggerDelay, useReveal } from '@/motion';

type VolunteerEntry = {
  role: string;
  org: string;
  period: string;
  detail: string;
  /** Key into src/data/orgs.ts. */
  logo?: string;
};

export function Experience({ index }: { index: number }) {
  const { t, i18n } = useTranslation();
  const jobRef = useReveal<HTMLElement>();

  const bullets = i18n.t('experience.items.trip.bullets', {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  const volunteer = i18n.t('experience.volunteer', {
    returnObjects: true,
    defaultValue: [],
  }) as VolunteerEntry[];

  return (
    <Section
      id="experience"
      index={index}
      eyebrow={t('experience.eyebrow')}
      title={t('experience.title')}
    >
      <article ref={jobRef} className="reveal motion-cascade group rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex items-start gap-4">
            <Logo org="trip" name={t('experience.items.trip.org')} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-fg sm:text-xl">
              <AnimatedText>{t('experience.items.trip.role')}</AnimatedText>
              </h3>
              <p className="mt-1.5 text-sm text-fg-muted">{t('experience.items.trip.org')}</p>
            </div>
          </div>
          <span
            className="eyebrow rounded-full border border-line px-2.5 py-1 text-fg-subtle"
            dir="ltr"
          >
            <AnimatedText>{t('experience.items.trip.period')}</AnimatedText>
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
              <span
                className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 border-t border-line pt-5 text-xs text-fg-subtle">
          {t('experience.items.trip.note')}
        </p>
      </article>

      <div className="mt-14">
        <h3 className="eyebrow text-fg"><AnimatedText>{t('experience.volunteerTitle')}</AnimatedText></h3>
        <ul className="mt-6 space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          {volunteer.map((entry, position) => (
            <VolunteerRow key={`${entry.role}-${entry.org}`} entry={entry} position={position} />
          ))}
        </ul>
      </div>
    </Section>
  );
}

function VolunteerRow({ entry, position }: { entry: VolunteerEntry; position: number }) {
  const ref = useReveal<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className="reveal motion-cascade group bg-bg p-5 transition-colors hover:bg-surface-alt sm:p-6"
      style={{ '--reveal-delay': `${staggerDelay(Math.min(position, 3))}ms` } as CSSProperties}
    >
      <div className="flex items-start gap-4">
        <Logo org={entry.logo} name={entry.org} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h4 className="text-sm font-semibold text-fg"><AnimatedText>{entry.role}</AnimatedText></h4>
            {entry.period ? (
              <span className="eyebrow text-fg-subtle" dir="ltr">
                {entry.period}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-accent">{entry.org}</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{entry.detail}</p>
        </div>
      </div>
    </li>
  );
}
