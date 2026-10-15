/**
 * Language-neutral facts taken verbatim from cv.pdf.
 * Anything that needs translating lives in src/i18n/locales/*.json instead.
 */
import { projects } from './projects';
import { assetUrl } from '@/lib/assets';
import { identityImages } from './identity';

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

/**
 * The counters under the hero. Every number is either stated in the CV or
 * counted from this repository's own data — nothing is estimated.
 *
 * `to` is the number the counter animates to; `suffix` is appended verbatim so
 * "150+" counts to 150 and keeps the plus.
 */
export const heroStats = [
  { id: 'endpoints', to: 150, suffix: '+' },      // CV: "150+ RESTful API endpoints"
  { id: 'components', to: 20, suffix: '+' },      // CV: "20+ reusable React components"
  { id: 'indicators', to: 60, suffix: '+' },      // CV: "60+ technical indicators"
  { id: 'projects', to: projects.length, suffix: '' }, // counted from src/data/projects.ts
] as const;

/** Portrait sizes for the hero and the small avatars; see data/identity.ts. */
export const identity = identityImages(import.meta.env.VITE_PROFILE_PHOTO_VERSION, assetUrl);
