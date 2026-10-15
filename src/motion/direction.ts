import { useTranslation } from 'react-i18next';

/**
 * Horizontal motion has to flip in Arabic. CSS uses `--dir` (1 or -1, set in
 * motion.css from the document direction): `translateX(calc(var(--dir) * 24px))`.
 * JavaScript multiplies by this.
 */
export function useDirectionSign(): 1 | -1 {
  const { i18n } = useTranslation();
  return i18n.dir(i18n.resolvedLanguage) === 'rtl' ? -1 : 1;
}

/** Event-time variant, read from the document rather than React state. */
export const directionSign = (): 1 | -1 => (document.documentElement.dir === 'rtl' ? -1 : 1);
