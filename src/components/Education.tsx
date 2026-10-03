import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Section } from './Section';

export function Education({ index }: { index: number }) {
  const { t, i18n } = useTranslation();

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
        <article className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <span
            className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent"
            aria-hidden="true"
          >
            <GraduationCap className="size-5" />
          </span>
          <h3 className="mt-5 text-lg leading-snug font-semibold text-fg sm:text-xl">
            {t('education.degree')}
          </h3>
          <p className="mt-2 text-sm text-fg-muted">{t('education.school')}</p>
          <p className="eyebrow mt-4 inline-block rounded-full border border-line px-2.5 py-1 text-fg-subtle">
            {t('education.period')}
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
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h3 className="eyebrow text-fg-subtle">{title}</h3>
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
