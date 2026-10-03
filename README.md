# Omar Borhom — Personal Website

A bilingual (English / Arabic) portfolio built with React, Vite, TypeScript and
Tailwind CSS. Static output, no backend, no analytics.

- English by default; Arabic with full RTL when chosen, and the choice persists
- Dark / light themes that follow the system preference until overridden, with no flash on load
- All content lives in a data layer, so editing the site never means touching a component
- Per-language SEO: `<title>`, meta description, Open Graph, hreflang, sitemap, JSON-LD

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                |
| `npm run build`     | Type-check, regenerate sitemap/robots, build to `dist/`   |
| `npm run preview`   | Serve the production build locally                        |
| `npm run typecheck` | Type-check only                                           |
| `npm run og`        | Re-render `public/og.svg` to `public/og.png`              |
| `npm run sitemap`   | Regenerate `public/sitemap.xml` and `public/robots.txt`   |

---

## Editing the content

Everything a visitor reads is in two places. **Components contain no copy.**

### 1. Translations — `src/i18n/locales/en.json` and `ar.json`

Every string on the site. The two files have identical key structures; if you
add a key to one, add it to the other.

```text
meta.*          Page title and description, per language
nav.*           Header links
hero.*          Headline, intro, button labels
about.*         About paragraphs and the "At a glance" list
projects.items.<id>.*   Per-project copy (see below)
skills.groups.*  Skill group labels
experience.*    Job entry and volunteering list
education.*     Degree, certificates, languages
contact.*       Contact labels
footer.*        Footer lines
a11y.*          Screen-reader labels for the toggles and the dialog
```

To verify both files still line up after an edit:

```bash
node -e "const f=n=>require('./src/i18n/locales/'+n+'.json');const p=(o,b='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?p(v,b+k+'.'):[b+k]);const a=p(f('en')),b=p(f('ar'));console.log('only in en:',a.filter(x=>!b.includes(x)));console.log('only in ar:',b.filter(x=>!a.includes(x)))"
```

### 2. Structured data — `src/data/`

| File          | Holds                                                                |
| ------------- | -------------------------------------------------------------------- |
| `site.ts`     | `SITE_URL` — the canonical origin, <https://omar-borhom.vercel.app>  |
| `profile.ts`  | Email, phone, GitHub/GitLab/LinkedIn URLs, CV filenames, hero stats  |
| `projects.ts` | Project ids, years, tech badges, repo links, metrics                 |
| `skills.ts`   | Skill groups and their items, plus the section order used by the nav |

### Adding a project

1. Add an entry to `featuredProjects` (or `moreProjects`) in
   [src/data/projects.ts](src/data/projects.ts):

   ```ts
   {
     id: 'my-project',          // must match the translation key
     year: '2026',
     stack: ['Laravel', 'MySQL'],
     links: [{ kind: 'github', url: 'https://github.com/…' }],
     metrics: [{ id: 'endpoints', value: '40+' }],  // optional
   }
   ```

2. Add `projects.items.my-project` to **both** locale files:

   ```json
   {
     "title": "…",
     "tagline": "…",
     "problem": "…",
     "solution": "…",
     "role": "…",
     "results": "…",       // optional — the section hides if absent
     "note": "…",          // optional
     "highlights": ["…", "…"]
   }
   ```

Entries in `moreProjects` only need `title` and `tagline`.

### Replacing the CV

Drop the new file at `public/cv.pdf`. To add an Arabic CV, put it at
`public/cv-ar.pdf` and set `cv.ar` in [src/data/profile.ts](src/data/profile.ts)
to `'cv-ar.pdf'` — the second download button appears automatically, and stays
hidden while that value is `null`.

### Changing the colours

All colour lives in `:root` / `.dark` at the top of
[src/index.css](src/index.css), as CSS variables mapped into Tailwind through
`@theme inline`. Change a variable and both the utilities and the components
follow. The comment block there lists the measured contrast ratios — keep
foreground pairs at 4.5:1 or better for body text.

### Changing the social card

Edit [public/og.svg](public/og.svg), then `npm run og`. Social crawlers do not
render SVG, so `og.png` is the file the meta tags point at.

---

## Deploy

**Vercel is the only deploy target.** The site is live at
<https://omar-borhom.vercel.app>.

### Pushing a change

```bash
git add -A
git commit -m "Describe the change"
git push            # -> Vercel builds and deploys automatically
```

Pushing to `main` deploys to production. Pushing any other branch, or opening
a pull request, gets a Vercel preview URL. There is no GitHub Actions
workflow and nothing to run by hand.

### How it is configured

[vercel.json](vercel.json) supplies everything, so there is nothing to set in
the Vercel dashboard:

- `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`
- an SPA rewrite, so a direct hit on any path (`/projects/x`, a stale
  bookmark) serves the app instead of a 404
- `/ar` and `/en` redirect to `/?lang=ar` and `/`, which is the URL scheme the
  hreflang tags use
- a one-year immutable cache on `/assets/*` (filenames are content-hashed) and
  basic security headers

The Vite `base` is `'/'` and must stay that way — a sub-path base breaks every
asset URL on Vercel.

### Changing the domain

`SITE_URL` in [src/data/site.ts](src/data/site.ts) is the single source for the
canonical tag, the hreflang alternates, the Open Graph and Twitter URLs, the
JSON-LD, and `sitemap.xml` / `robots.txt` (regenerated on every build). Change
it there and nowhere else.

---

## Project layout

```text
src/
├── App.tsx                 Section order, SEO effect
├── main.tsx                Entry point
├── index.css               Theme tokens, base styles, .eyebrow / .reveal
├── components/             One file per section, plus Section/Badge/Toggles
├── data/                   Structured content (see above)
├── hooks/
│   ├── useTheme.ts         Theme state, persistence, system-preference watch
│   ├── useLanguage.ts      Language, <html lang/dir>, ?lang= query
│   ├── useReveal.ts        IntersectionObserver scroll reveal
│   └── useScrollSpy.ts     Active nav section
├── i18n/                   i18next setup and the locale JSON files
└── lib/
    ├── seo.ts              Per-language head tags and JSON-LD
    └── assets.ts           URLs for files in /public
public/                     cv.pdf, og.png/svg, favicon, robots.txt, sitemap.xml
scripts/                    Sitemap and OG image generators
```

---

## Notes

- **Language**: English is the default on every first visit. The browser's own
  language is deliberately not consulted — Arabic appears only when the visitor
  picks it with the header toggle or arrives on `?lang=ar`, and that choice is
  then kept in `localStorage`. The resolution order is implemented twice, in
  `detectLanguage()` ([src/i18n/index.ts](src/i18n/index.ts)) and in the inline
  script in [index.html](index.html); change both together or they disagree.
- **Browser support**: the build targets ES2020. Logical CSS properties
  (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) are used throughout instead of
  left/right, which is what makes the RTL mirroring automatic.
- **Motion**: all animation is CSS and is disabled under
  `prefers-reduced-motion: reduce`.
- **Fonts**: Space Grotesk (Latin display), Inter (Latin body) and IBM Plex
  Sans Arabic, loaded from Google Fonts with `display=swap` and a system-font
  fallback chain. Arabic swaps the display and body faces to IBM Plex Sans
  Arabic automatically.
