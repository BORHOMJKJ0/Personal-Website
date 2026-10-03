import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sections } from '@/data/skills';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import type { Theme } from '@/hooks/useTheme';
import { Container } from './Section';
import { LanguageToggle, ThemeToggle } from './Toggles';

export function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { t } = useTranslation();
  const activeId = useScrollSpy(sections);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // A hairline border only once the page has moved keeps the hero edge clean.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 bg-bg/85 backdrop-blur-md transition-shadow ${
        scrolled ? 'border-b border-line' : 'border-b border-transparent'
      }`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <a
            href="#top"
            className="group flex items-center gap-2.5 rounded-sm"
            aria-label={t('nav.brandAria')}
          >
            <span
              className="grid size-7 place-items-center rounded-md bg-accent font-mono text-[0.7rem] font-semibold text-accent-fg"
              aria-hidden="true"
            >
              OB
            </span>
            <span className="eyebrow hidden text-fg transition-colors group-hover:text-accent sm:inline">
              {t('hero.name')}
            </span>
          </a>

          <nav aria-label={t('nav.primaryLabel')} className="hidden items-center gap-1 lg:flex">
            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={activeId === id ? 'true' : undefined}
                className={`eyebrow rounded-full px-3 py-2 transition-colors ${
                  activeId === id
                    ? 'bg-accent-soft text-accent'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:text-fg lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {menuOpen ? (
                <X className="size-[1.05rem]" aria-hidden="true" />
              ) : (
                <Menu className="size-[1.05rem]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Kept in the DOM but hidden so the open/close state is simple and the
          links stay in source order for assistive tech. */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-y border-line bg-bg shadow-card lg:hidden"
      >
        <Container className="py-3">
          <nav aria-label={t('nav.primaryLabel')}>
            <ul className="grid gap-1">
              {sections.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={activeId === id ? 'true' : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeId === id ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {t(`nav.${id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
