import { useTranslation } from 'react-i18next';
import type { CSSProperties } from 'react';
import { services } from '@/data/services';
import { useReveal } from '@/hooks/useReveal';
import { Badge } from './Badge';
import { Section } from './Section';
import { AnimatedText } from './AnimatedText';
import { usePointerTilt } from '@/hooks/usePointerTilt';

export function Services({ index }: { index: number }) {
  const { t } = useTranslation();

  return (
    <Section
      id="services"
      index={index}
      eyebrow={t('services.eyebrow')}
      title={t('services.title')}
      subtitle={t('services.subtitle')}
      tinted
    >
      <ul className="grid gap-5 sm:grid-cols-2">
        {services.map((service, position) => (
          <ServiceCard key={service.id} service={service} position={position} />
        ))}
      </ul>
    </Section>
  );
}

function ServiceCard({
  service,
  position,
}: {
  service: (typeof services)[number];
  position: number;
}) {
  const { t } = useTranslation();
  const ref = useReveal<HTMLLIElement>();
  const tilt = usePointerTilt<HTMLLIElement>();
  const { Icon } = service;

  return (
    <li
      ref={ref}
      className="reveal motion-cascade tilt-card group rounded-2xl border border-line bg-surface p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-card sm:p-7"
      {...tilt}
      style={{ '--reveal-delay': `${Math.min(position, 3) * 70}ms` } as CSSProperties}
    >
      <span className="service-icon inline-flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-semibold text-fg transition-colors group-hover:text-accent">
        <AnimatedText>{t(`services.items.${service.id}.title`)}</AnimatedText>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {t(`services.items.${service.id}.summary`)}
      </p>

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {service.tech.map((tech) => (
          <li key={tech}>
            <Badge>{tech}</Badge>
          </li>
        ))}
      </ul>
    </li>
  );
}
