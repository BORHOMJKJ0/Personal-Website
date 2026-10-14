import { useTranslation } from 'react-i18next';
import { useState, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { heroStats } from '@/data/profile';
import { useCountUp } from '@/hooks/useCountUp';
import { useReveal } from '@/hooks/useReveal';
import { AnimatedText } from './AnimatedText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const EFFECTS = ['roll', 'flip', 'bounce', 'wipe'] as const;

/**
 * Each counter has its own digit effect, plus viewport and explicit replay.
 */
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
            index={index}
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
  index,
  trigger,
}: {
  to: number;
  suffix: string;
  label: string;
  index: number;
  trigger: number;
}) {
  const { ref, value, previous, progress, playing, runId, replay } = useCountUp(to, {
    duration: 2400 + index * 220, delay: 180 + index * 170, trigger,
  });
  const digits = String(value).padStart(String(to).length, ' ');
  const oldDigits = String(previous).padStart(digits.length, ' ');

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`stat-card counter-variant-${EFFECTS[index % EFFECTS.length]} group bg-bg px-4 py-5 transition-colors hover:bg-surface-alt sm:px-5 ${playing ? 'is-counting' : 'is-settled'}`}
      data-counter-run={runId}
      style={{ '--stat-index': index, '--counter-progress': progress } as CSSProperties}
      onMouseEnter={() => { if (!playing) replay(); }}
    >
      <span className="stat-sheen" key={`sheen-${runId}`} aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd>
        {/*
          Digits are LTR even on an RTL page, and tabular figures stop the
          number jittering sideways as it counts.
        */}
        <span
          dir="ltr"
          className="counter-number block font-display text-3xl font-bold tabular-nums text-fg transition-colors group-hover:text-accent sm:text-4xl"
        >
          <span className="sr-only">{to}{suffix}</span>
          <span aria-hidden="true" className="counter-digits" key={runId}>
            <span data-counter={to} className="sr-only">{value}{suffix}</span>
            {[...digits].map((digit, position) => (
              <span className="counter-digit" key={`${position}-${digit}`}>
                <span className="digit-previous">{oldDigits[position]}</span>
                <span className="digit-current">{digit}</span>
              </span>
            ))}
            {suffix && <span className="counter-suffix">{suffix}</span>}
            <span className="counter-final">{to}{suffix}</span>
          </span>
        </span>
        <span className="mt-1.5 block text-xs leading-snug text-fg-subtle"><AnimatedText words>{label}</AnimatedText></span>
      </dd>
      <span className="stat-progress" aria-hidden="true" />
      <span className="stat-sparks" aria-hidden="true" key={`sparks-${runId}`}>
        {[-1, 0, 1].map((direction) => <i key={direction} style={{ '--spark-x': `${direction * 24}px` } as CSSProperties} />)}
      </span>
    </div>
  );
}
