import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { Section } from './Section';
import { AnimatedText } from './AnimatedText';
import { useReveal } from '@/motion';

export function Education({ index }: { index: number }) {
  const { t, i18n } = useTranslation();
  const degreeRef = useReveal<HTMLElement>();

  const certs = i18n.t('education.certs', { returnObjects: true, defaultValue: [] }) as string[];
  const languages = i18n.t('education.languages', {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  return (
    <Section
      id="education"
      index={index}
      eyebrow={t('education.eyebrow')}
      title={t('education.title')}
      tinted
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <article ref={degreeRef} className="reveal motion-cascade group rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <Logo org="damascus-university" name={t('education.school')} size="lg" />
          <h3 className="mt-5 text-lg leading-snug font-semibold text-fg sm:text-xl">
            <AnimatedText>{t('education.degree')}</AnimatedText>
          </h3>
          <p className="mt-2 text-sm text-fg-muted">{t('education.school')}</p>
          <p className="eyebrow mt-4 inline-block rounded-full border border-line px-2.5 py-1 text-fg-subtle">
            <AnimatedText>{t('education.period')}</AnimatedText>
          </p>
        </article>

        <div className="grid gap-5">
          <ListCard title={t('education.certsTitle')} items={certs} />
          <ListCard title={t('education.languagesTitle')} items={languages} />
        </div>
      </div>
    </Section>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal motion-cascade rounded-2xl border border-line bg-surface p-6">
      <h3 className="eyebrow text-fg-subtle"><AnimatedText>{title}</AnimatedText></h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-fg">
            <span
              className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
