import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, isLanguage, languageMeta, type Language } from '@/i18n';

/**
 * Owns everything that has to change when the language changes: the i18next
 * instance, <html lang>/<html dir>, localStorage, and the ?lang= query param
 * that the hreflang alternates point at.
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
  const dir = languageMeta[language].dir;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = dir;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Blocked storage: the choice simply does not survive a reload.
    }

    // Give each language its own shareable URL without a navigation.
    const url = new URL(window.location.href);
    if (language === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', language);
    if (url.toString() !== window.location.href) {
      window.history.replaceState(null, '', url);
    }
  }, [language, dir]);

  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next);
    },
    [i18n],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  return { language, dir, setLanguage, toggleLanguage } as const;
}
