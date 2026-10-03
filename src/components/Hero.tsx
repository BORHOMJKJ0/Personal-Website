import { ArrowRight, Download, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { heroStats, profile } from '@/data/profile';
import { GitHubIcon, GitLabIcon, LinkedInIcon } from './BrandIcons';
import { assetUrl } from '@/lib/assets';
import { Container } from './Section';

const ICON_LINK =
  'inline-flex size-10 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-accent';

export function Hero() {
  const { t } = useTranslation();

  const socials = [
    { href: profile.links.github, Icon: GitHubIcon, label: 'GitHub' },
    { href: profile.links.gitlab, Icon: GitLabIcon, label: 'GitLab' },
    { href: profile.links.linkedin, Icon: LinkedInIcon, label: 'LinkedIn' },
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <Container>
        <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-fg-muted">
          <span className="relative grid size-2 place-items-center" aria-hidden="true">
            <span className="absolute size-2 animate-ping rounded-full bg-accent/60" />
            <span className="size-2 rounded-full bg-accent" />
          </span>
          {t('hero.availability')}
        </p>

        <h1 className="mt-7 text-display leading-[0.95] font-bold text-fg">{t('hero.name')}</h1>

        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-medium text-fg sm:text-2xl">
          <span>{t('hero.role')}</span>
          <span className="h-5 w-px bg-line-strong" aria-hidden="true" />
          <span dir="ltr" className="font-mono text-base text-accent sm:text-lg">
            {t('hero.roleLong')}
          </span>
        </p>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {t('hero.intro')}
        </p>

        <p className="eyebrow mt-5 inline-flex items-center gap-1.5 text-fg-subtle">
          <MapPin className="size-3.5" aria-hidden="true" />
          {t('hero.location')}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#projects"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            {t('hero.ctaProjects')}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          <a
            href={assetUrl(profile.cv.en)}
            download
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
          >
            <Download className="size-4" aria-hidden="true" />
            {t('hero.ctaCvEn')}
          </a>

          {/* Rendered only once an Arabic CV exists in /public. */}
          {profile.cv.ar ? (
            <a
              href={assetUrl(profile.cv.ar)}
              download
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
            >
              <Download className="size-4" aria-hidden="true" />
              {t('hero.ctaCvAr')}
            </a>
          ) : null}

          <ul className="flex items-center gap-2 ms-auto">
            {socials.map(({ href, Icon, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={ICON_LINK}
                  aria-label={`${label} — ${t('a11y.opensInNewTab')}`}
                >
                  <Icon className="size-[1.1rem]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <dl
          aria-label={t('hero.statsLabel')}
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4"
        >
          {heroStats.map((stat) => (
            <div key={stat.id} className="bg-bg px-4 py-5 sm:px-5">
              <dt className="sr-only">{t(`stats.${stat.id}`)}</dt>
              <dd>
                <span
                  dir="ltr"
                  className="block font-display text-3xl font-bold text-fg sm:text-4xl"
                >
                  {stat.value}
                </span>
                <span className="mt-1.5 block text-xs leading-snug text-fg-subtle">
                  {t(`stats.${stat.id}`)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
