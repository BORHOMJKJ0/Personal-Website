import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { Education } from '@/components/Education';
import { Experience } from '@/components/Experience';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Projects } from '@/components/Projects';
import { Skills } from '@/components/Skills';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { applyJsonLd, applySeo } from '@/lib/seo';

export default function App() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();

  // Head tags are the one thing React does not own, so they are re-applied
  // whenever the language changes.
  useEffect(() => {
    applySeo(language, {
      title: t('meta.title'),
      description: t('meta.description'),
      ogTitle: t('meta.ogTitle'),
      ogDescription: t('meta.ogDescription'),
    });
    applyJsonLd({
      language,
      name: t('hero.name'),
      jobTitle: t('hero.role'),
      description: t('meta.description'),
      locality: t('contact.locationValue'),
    });
  }, [language, t]);

  return (
    <>
      <a
        href="#main"
        className="eyebrow sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:start-3 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-accent focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-accent-fg"
      >
        {t('a11y.skipToContent')}
      </a>

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main id="main">
        <Hero />
        <About index={1} />
        <Projects index={2} />
        <Skills index={3} />
        <Experience index={4} />
        <Education index={5} />
        <Contact index={6} />
      </main>

      <Footer />
    </>
  );
}
