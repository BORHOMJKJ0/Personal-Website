import { useTranslation } from 'react-i18next';
import type { CSSProperties } from 'react';
import { skillGroups, type SkillGroup } from '@/data/skills';
import { Section } from './Section';
import { AnimatedText } from './AnimatedText';
import { staggerDelay, useReveal } from '@/motion';

export function Skills({ index }: { index: number }) {
  const { t } = useTranslation();

  return (
    <Section
      id="skills"
      index={index}
      eyebrow={t('skills.eyebrow')}
      title={t('skills.title')}
      subtitle={t('skills.subtitle')}
      tinted
    >
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, position) => (
          <SkillCard
            key={group.id}
            label={t(`skills.groups.${group.id}`)}
            Icon={group.Icon}
            items={group.items}
            position={position}
          />
        ))}
      </ul>
    </Section>
  );
}

function SkillCard({
  label,
  Icon,
  items,
  position,
}: {
  label: string;
  Icon: SkillGroup['Icon'];
  items: string[];
  position: number;
}) {
  const ref = useReveal<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className="reveal motion-cascade group flex flex-col bg-bg p-6 transition-colors hover:bg-surface-alt lg:last:col-span-3"
      style={{ '--reveal-delay': `${staggerDelay(Math.min(position, 5))}ms` } as CSSProperties}
    >
      <h3 className="flex items-center gap-3 text-sm font-semibold text-fg">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-(--dur-base) group-hover:scale-110">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <AnimatedText>{label}</AnimatedText>
      </h3>
      {/* Technology names stay LTR so mixed Arabic/Latin lines read correctly. */}
      <ul dir="ltr" className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
        {items.map((item, itemIndex) => (
          <li key={item} className="skill-item font-mono text-[0.8125rem] text-fg-muted">
            {item}
            {itemIndex < items.length - 1 ? (
              <span className="text-line-strong" aria-hidden="true">
                {' '}
                /
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </li>
  );
}
