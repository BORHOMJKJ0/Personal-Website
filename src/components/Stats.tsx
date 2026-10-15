import { useTranslation } from 'react-i18next';
import { useState, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { heroStats } from '@/data/profile';
import { useCountUp } from '@/hooks/useCountUp';
import { STAGGER, useReducedMotion, useReveal } from '@/motion';
import { AnimatedText } from './AnimatedText';

/** Ones place: two turns of 0–9, so even a final 0 visibly rolls. */
const ONES_REEL = [...'01234567890123456789'];
/** Higher places start blank, so 150 rolls in as "  0" → "150", not "000". */
const HIGH_REEL = [' ', ...'0123456789'];

/** Counters roll once into place on entry; replay from the button or hover. */
export function Stats() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDListElement>();
  const [trigger, setTrigger] = useState(0);
  const reduced = useReducedMotion();

  return (
    <div className="relative">
      {!reduced && (
        <button
          type="button"
          onClick={() => setTrigger((current) => current + 1)}
          className="stats-replay motion-interactive absolute -top-9 end-0 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-fg-subtle hover:text-accent"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          {t('hero.replayStats')}
        </button>
      )}
      <dl
        ref={ref}
        aria-label={t('hero.statsLabel')}
        className="reveal stat-strip grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4"
      >
        {heroStats.map((stat, index) => (
          <Stat
            key={stat.id}
            to={stat.to}
            suffix={stat.suffix}
            label={t(`stats.${stat.id}`)}
            delay={index * STAGGER * 2}
            trigger={trigger}
          />
        ))}
      </dl>
    </div>
  );
}

function Stat({
  to,
  suffix,
  label,
  delay,
  trigger,
}: {
  to: number;
  suffix: string;
  label: string;
  delay: number;
  trigger: number;
}) {
  const { ref, phase, runId, replay } = useCountUp({ delay, trigger });
  const digits = [...String(to)];

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="stat-card group bg-bg px-4 py-5 transition-colors hover:bg-surface-alt sm:px-5"
      data-counter-phase={phase}
      data-counter-run={runId}
      style={{ '--counter-delay': `${delay}ms` } as CSSProperties}
      onMouseEnter={() => {
        if (phase === 'done') replay();
      }}
    >
      <dt className="sr-only">{label}</dt>
      <dd>
        {/*
          Digits are LTR even on an RTL page. The visible number is hidden
          from assistive technology, which reads the final value once.
        */}
        <span
          dir="ltr"
          className="counter-number block font-display text-3xl font-bold tabular-nums text-fg transition-colors group-hover:text-accent sm:text-4xl"
        >
          <span className="sr-only">{`${to}${suffix}`}</span>
          {phase === 'done' ? (
            <span aria-hidden="true" className="counter-final" data-counter={to}>
              {`${to}${suffix}`}
            </span>
          ) : (
            <span aria-hidden="true" className="counter-reels">
              {digits.map((digit, position) => {
                const ones = position === digits.length - 1;
                const reel = ones ? ONES_REEL : HIGH_REEL;
                const target = ones ? 10 + Number(digit) : Number(digit) + 1;
                return (
                  <span className="counter-reel" key={position}>
                    <span
                      className={ones ? 'counter-strip counter-strip--ones' : 'counter-strip'}
                      style={{ '--reel-index': phase === 'rolling' ? target : 0 } as CSSProperties}
                    >
                      {reel.map((glyph, i) => (
                        <span key={i}>{glyph}</span>
                      ))}
                    </span>
                  </span>
                );
              })}
              {suffix && <span className="counter-suffix">{suffix}</span>}
            </span>
          )}
        </span>
        <span className="mt-1.5 block text-xs leading-snug text-fg-subtle">
          <AnimatedText>{label}</AnimatedText>
        </span>
      </dd>
      <span className="stat-progress" aria-hidden="true" />
    </div>
  );
}
