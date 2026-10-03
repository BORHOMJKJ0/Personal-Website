import { OG_IMAGE, SITE_URL } from '@/data/site';
import { profile } from '@/data/profile';
import { languageMeta, type Language } from '@/i18n';

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let tag = document.head.querySelector<HTMLLinkElement>(selector);
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = rel;
    if (hreflang) tag.hreflang = hreflang;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

export type SeoContent = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

/** Canonical URL for a language. English lives at the root. */
export function canonicalFor(language: Language): string {
  return language === 'en' ? `${SITE_URL}/` : `${SITE_URL}/?lang=${language}`;
}

/**
 * The document head is the one place a client-rendered bilingual site has to
 * stay in sync by hand: title, description, canonical, hreflang alternates,
 * Open Graph locale and the Person JSON-LD all depend on the active language.
 */
export function applySeo(language: Language, content: SeoContent) {
  const canonical = canonicalFor(language);

  document.title = content.title;
  setMeta('meta[name="description"]', 'name', 'description', content.description);

  setLink('canonical', canonical);
  setLink('alternate', canonicalFor('en'), 'en');
  setLink('alternate', canonicalFor('ar'), 'ar');
  setLink('alternate', canonicalFor('en'), 'x-default');

  setMeta('meta[property="og:title"]', 'property', 'og:title', content.ogTitle);
  setMeta(
    'meta[property="og:description"]',
    'property',
    'og:description',
    content.ogDescription,
  );
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMeta('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE);
  setMeta(
    'meta[property="og:locale"]',
    'property',
    'og:locale',
    languageMeta[language].htmlLocale,
  );
  setMeta(
    'meta[property="og:locale:alternate"]',
    'property',
    'og:locale:alternate',
    languageMeta[language === 'en' ? 'ar' : 'en'].htmlLocale,
  );

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', content.ogTitle);
  setMeta(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    content.ogDescription,
  );
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE);
}

/** Person schema, re-emitted per language so search engines index both names. */
export function applyJsonLd(options: {
  language: Language;
  name: string;
  jobTitle: string;
  description: string;
  locality: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: options.name,
    jobTitle: options.jobTitle,
    description: options.description,
    url: canonicalFor(options.language),
    email: `mailto:${profile.email}`,
    telephone: profile.phoneHref,
    address: {
      '@type': 'PostalAddress',
      addressLocality: options.locality,
      addressCountry: 'SY',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Damascus University',
    },
    knowsLanguage: ['ar', 'en'],
    sameAs: [profile.links.github, profile.links.gitlab, profile.links.linkedin],
  };

  const id = 'person-jsonld';
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
