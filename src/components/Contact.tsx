import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { profile } from '@/data/profile';
import { GitHubIcon, GitLabIcon, LinkedInIcon } from './BrandIcons';
import { Section } from './Section';

export function Contact({ index }: { index: number }) {
  const { t } = useTranslation();

  const socials = [
    { href: profile.links.github, Icon: GitHubIcon, label: 'GitHub' },
    { href: profile.links.gitlab, Icon: GitLabIcon, label: 'GitLab' },
    { href: profile.links.linkedin, Icon: LinkedInIcon, label: 'LinkedIn' },
  ];

  return (
    <Section
      id="contact"
      index={index}
      eyebrow={t('contact.eyebrow')}
      title={t('contact.title')}
      subtitle={t('contact.subtitle')}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          <Row
            Icon={Mail}
            label={t('contact.emailLabel')}
            value={profile.email}
            href={`mailto:${profile.email}`}
          />
          <Row
            Icon={Phone}
            label={t('contact.phoneLabel')}
            value={profile.phone}
            href={`tel:${profile.phoneHref}`}
          />
          <Row Icon={MapPin} label={t('contact.locationLabel')} value={t('contact.locationValue')} />
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <a
            href={`mailto:${profile.email}`}
            className="group inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            {t('contact.ctaEmail')}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          <div>
            <h3 className="eyebrow text-fg-subtle">{t('contact.elsewhereLabel')}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {socials.map(({ href, Icon, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                    <span className="sr-only"> ({t('a11y.opensInNewTab')})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Row({
  Icon,
  label,
  value,
  href,
}: {
  Icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="eyebrow block text-fg-subtle">{label}</span>
        {/* Emails, phone numbers and URLs are LTR even on an RTL page. */}
        <span dir="ltr" className="mt-1 block truncate text-sm font-medium text-fg">
          {value}
        </span>
      </span>
    </>
  );

  return (
    <div className="bg-bg">
      {href ? (
        <a
          href={href}
          className="flex items-center gap-4 p-5 transition-colors hover:bg-surface-alt"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-4 p-5">{content}</div>
      )}
    </div>
  );
}
