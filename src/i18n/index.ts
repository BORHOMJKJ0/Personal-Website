import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'lang';

export const languageMeta: Record<Language, { label: string; nativeLabel: string; dir: 'ltr' | 'rtl'; htmlLocale: string }> = {
  en: { label: 'English', nativeLabel: 'EN', dir: 'ltr', htmlLocale: 'en_US' },
  ar: { label: 'العربية', nativeLabel: 'ع', dir: 'rtl', htmlLocale: 'ar_SY' },
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Resolution order, matching the inline script in index.html so the server
 * markup and the React tree never disagree about language:
 *   1. ?lang= query param (also what the hreflang alternates point at)
 *   2. localStorage
 *   3. navigator language
 *   4. 'en'
 */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (isLanguage(fromQuery)) return fromQuery;

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Blocked storage (private mode): fall through to the browser language.
  }

  const navigatorLanguage = window.navigator.languages?.[0] ?? window.navigator.language ?? 'en';
  return /^ar\b/i.test(navigatorLanguage) ? 'ar' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
