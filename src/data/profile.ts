/**
 * Language-neutral facts taken verbatim from cv.pdf.
 * Anything that needs translating lives in src/i18n/locales/*.json instead.
 */
export const profile = {
  email: 'hborhom89@gmail.com',
  phone: '+963 949 100 479',
  phoneHref: '+963949100479',
  links: {
    github: 'https://github.com/BORHOMJKJ0',
    gitlab: 'https://gitlab.com/BORHOMJKJ0',
    linkedin: 'https://linkedin.com/in/omar-borhom-b3b4381a4',
  },
  /**
   * CV files served from /public. `ar` stays null until an Arabic CV exists —
   * the second download button hides itself rather than 404.
   */
  cv: {
    en: 'cv.pdf',
    ar: null as string | null, // TODO: add public/cv-ar.pdf to enable the Arabic CV button
  },
  education: {
    start: '2022',
    endKey: 'present' as const,
  },
} as const;

/** Numbers shown in the hero strip. Every value is stated in the CV. */
export const heroStats = [
  { id: 'endpoints', value: '150+' },
  { id: 'components', value: '20+' },
  { id: 'indicators', value: '60+' },
  { id: 'architectures', value: '3' },
] as const;
