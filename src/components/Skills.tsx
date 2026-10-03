import { useTranslation } from 'react-i18next';
import { skillGroups } from '@/data/skills';
import { useReveal } from '@/hooks/useReveal';
import { Section } from './Section';

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
  items,
  position,
}: {
  label: string;
  items: string[];
  position: number;
}) {
  const ref = useReveal<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className="reveal flex flex-col bg-bg p-6 lg:last:col-span-3"
      style={{ transitionDelay: `${Math.min(position, 5) * 50}ms` }}
    >
      <h3 className="flex items-center gap-2.5 text-sm font-semibold text-fg">
        <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
        {label}
      </h3>
      {/* Technology names stay LTR so mixed Arabic/Latin lines read correctly. */}
      <ul dir="ltr" className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
        {items.map((item, itemIndex) => (
          <li key={item} className="font-mono text-[0.8125rem] text-fg-muted">
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
