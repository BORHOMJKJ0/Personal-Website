import { useTranslation } from 'react-i18next';
import { Section } from './Section';

const FACTS = ['location', 'study', 'focus', 'languages', 'cp'] as const;

export function About({ index }: { index: number }) {
  const { t } = useTranslation();

  return (
    <Section
      id="about"
      index={index}
      eyebrow={t('about.eyebrow')}
      title={t('about.title')}
    >
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="space-y-5 text-base leading-relaxed text-fg-muted sm:text-lg">
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>
        </div>

        <div className="border-s-2 border-accent ps-6">
          <h3 className="eyebrow text-fg">{t('about.factsTitle')}</h3>
          <dl className="mt-5 space-y-4">
            {FACTS.map((fact) => (
              <div key={fact}>
                <dt className="eyebrow text-fg-subtle">{t(`about.facts.${fact}Label`)}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-fg">
                  {t(`about.facts.${fact}Value`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
