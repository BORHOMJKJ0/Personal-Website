import { useTranslation } from 'react-i18next';
import { heroStats } from '@/data/profile';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * The counter strip under the hero. Each number animates up once, the first
 * time it scrolls into view.
 */
export function Stats() {
  const { t } = useTranslation();

  return (
    <dl
      aria-label={t('hero.statsLabel')}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4"
    >
      {heroStats.map((stat, index) => (
        <Stat
          key={stat.id}
          to={stat.to}
          suffix={stat.suffix}
          label={t(`stats.${stat.id}`)}
          index={index}
        />
      ))}
    </dl>
  );
}

function Stat({
  to,
  suffix,
  label,
  index,
}: {
  to: number;
  suffix: string;
  label: string;
  index: number;
}) {
  const { ref, value } = useCountUp(to, { duration: 1200 + index * 160 });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="group bg-bg px-4 py-5 transition-colors hover:bg-surface-alt sm:px-5"
    >
      <dt className="sr-only">{label}</dt>
      <dd>
        {/*
          Digits are LTR even on an RTL page, and tabular figures stop the
          number jittering sideways as it counts.
        */}
        <span
          dir="ltr"
          className="block font-display text-3xl font-bold tabular-nums text-fg transition-colors group-hover:text-accent sm:text-4xl"
        >
          {value}
          {suffix}
        </span>
        <span className="mt-1.5 block text-xs leading-snug text-fg-subtle">{label}</span>
      </dd>
    </div>
  );
}
