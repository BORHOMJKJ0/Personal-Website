import { ArrowRight, Download, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { profile } from '@/data/profile';
import { assetUrl } from '@/lib/assets';
import { Avatar } from './Avatar';
import { GitHubIcon, GitLabIcon, LinkedInIcon } from './BrandIcons';
import { FloatingTech } from './FloatingTech';
import { Container } from './Section';
import { Stats } from './Stats';
import { AnimatedText } from './AnimatedText';
import { TypingRole } from './TypingRole';

const ICON_LINK =
  'inline-flex size-10 items-center justify-center rounded-full border border-line text-fg-muted transition-[color,border-color,transform] hover:-translate-y-0.5 hover:border-accent hover:text-accent';

export function Hero() {
  const { t, i18n } = useTranslation();

  const socials = [
    { href: profile.links.github, Icon: GitHubIcon, label: 'GitHub' },
    { href: profile.links.gitlab, Icon: GitLabIcon, label: 'GitLab' },
    { href: profile.links.linkedin, Icon: LinkedInIcon, label: 'LinkedIn' },
  ];

  const phrases = i18n.t('hero.typingPhrases', {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-ambient" aria-hidden="true"><span /><span /></div>
      <FloatingTech />

      <Container>
        <div className="flex flex-col-reverse items-start gap-8 lg:flex-row lg:items-center lg:gap-14">
          <div className="min-w-0 flex-1">
            <p className="hero-enter eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-fg-muted">
              <span className="relative grid size-2 place-items-center" aria-hidden="true">
                <span className="absolute size-2 animate-ping rounded-full bg-accent/60" />
                <span className="size-2 rounded-full bg-accent" />
              </span>
              {t('hero.availability')}
            </p>

            {/* The name is the loudest thing on the page, in both languages. */}
            <h1 className="mt-6 text-display leading-[0.92] font-bold tracking-tight text-fg">
              <AnimatedText>{t('hero.name')}</AnimatedText>
            </h1>

            <p className="hero-enter hero-enter-1 mt-4 text-lg font-medium text-fg sm:text-2xl">
              <TypingRole key={i18n.resolvedLanguage} phrases={phrases.length ? phrases : [t('hero.role')]} />
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              <AnimatedText words>{t('hero.intro')}</AnimatedText>
            </p>

            <p className="hero-enter hero-enter-2 eyebrow mt-5 inline-flex items-center gap-1.5 text-fg-subtle">
              <MapPin className="size-3.5" aria-hidden="true" />
              {t('hero.location')}
            </p>

            <div className="hero-enter hero-enter-3 mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="motion-interactive group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-accent-hover"
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
                className="motion-interactive inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fg transition-[color,border-color,transform] hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                <Download className="size-4" aria-hidden="true" />
                {t('hero.ctaCvEn')}
              </a>

              {/* Rendered only once an Arabic CV exists in /public. */}
              {profile.cv.ar ? (
                <a
                  href={assetUrl(profile.cv.ar)}
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fg transition-[color,border-color,transform] hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t('hero.ctaCvAr')}
                </a>
              ) : null}

              <ul className="flex items-center gap-2">
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
          </div>

          <Avatar />
        </div>

        <div className="mt-14 sm:mt-16">
          <Stats />
        </div>
      </Container>
    </section>
  );
}
