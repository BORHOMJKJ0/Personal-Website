import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import type { Theme } from '@/hooks/useTheme';

const BUTTON_BASE =
  'inline-flex h-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg hover:bg-surface-alt';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const { t } = useTranslation();
  const label = theme === 'dark' ? t('a11y.themeToLight') : t('a11y.themeToDark');

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${BUTTON_BASE} w-9`}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'dark' ? (
        <Sun className="size-[1.05rem]" aria-hidden="true" />
      ) : (
        <Moon className="size-[1.05rem]" aria-hidden="true" />
      )}
    </button>
  );
}

export function LanguageToggle() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  // The button shows the language it switches TO, which is the convention
  // visitors expect from a two-language toggle.
  const target = language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`${BUTTON_BASE} gap-1.5 px-3`}
      aria-label={t('a11y.languageToggle')}
      title={t('a11y.languageToggle')}
      lang={target}
    >
      <span className="eyebrow" dir={target === 'ar' ? 'rtl' : 'ltr'}>
        {target === 'ar' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
