# CLAUDE.md

Context for future sessions on this repository.

## What this is

Omar Borhom's personal portfolio site. Single page, static, no backend.
Bilingual English/Arabic with full RTL, dark/light themes.

**The CV at `./cv.pdf` is the source of truth for all content.** Nothing on the
site states a fact, number or achievement that is not in that PDF, with two
deliberate, documented exceptions (see *Content provenance* below). Do not add
claims that the CV does not support.

## Stack

| Choice | Version | Why |
| --- | --- | --- |
| React | 19 | — |
| Vite | 8 (rolldown) | Static output, fast builds |
| TypeScript | 7 | Note: `baseUrl` was **removed** in TS 7; `paths` in `tsconfig.app.json` resolve relative to the tsconfig file |
| Tailwind CSS | 4 | CSS-first config via `@theme inline`, no `tailwind.config.js` |
| react-i18next | 17 | Two bundled JSON locales, no lazy loading (they are small) |
| lucide-react | 1 | UI icons only — **v1 dropped all brand icons**, so GitHub/GitLab/LinkedIn are inline SVG in `src/components/BrandIcons.tsx` |

No router (single page, anchor navigation), no animation library (CSS only),
no component library.

## Architecture decisions

**Content lives in a data layer, never in components.** Prose is in
`src/i18n/locales/{en,ar}.json`; structure (ids, years, URLs, tech badges,
metric values) is in `src/data/*.ts`. The two are joined by project `id`:
a project with `id: 'baraa'` reads its copy from `projects.items.baraa.*`.
If you add a component, it must take its text from `t()`.

**Theme and direction are applied before React mounts.** The inline script in
`index.html` reads `localStorage` and the system preference and sets
`<html class="dark">`, `lang` and `dir` during head parsing, before the
stylesheet and before the module script. `useTheme` then *initialises from the
DOM* rather than recomputing — that is what keeps the first paint flash-free.
If you change the detection logic, change it in **both** places or they will
disagree.

**Language resolution order** (also duplicated in both places):
`?lang=` query → `localStorage` → `navigator.language` → `en`.
The `?lang=ar` query param exists so each language has a real, shareable URL
for the hreflang alternates; `useLanguage` keeps it in sync via
`history.replaceState`.

**Colour is defined once per theme** as CSS variables on `:root` and `.dark`
in `src/index.css`, then exposed to Tailwind with `@theme inline` so
`bg-surface` compiles to `var(--color-surface)`. Never hard-code a hex value
in a component. The contrast ratios for every token pair are documented in a
comment above the definitions and were verified against the rendered page in
all four language/theme combinations.

**Custom Tailwind variants** are declared explicitly in `src/index.css` rather
than relying on plugin defaults:
`@custom-variant dark`, `rtl`, `ltr`.

## RTL rules

These are easy to break and were each fixed once already:

1. **Use logical utilities only** — `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`,
   never `ml-`/`mr-`/`left-`/`right-`. Mirroring is then automatic.
2. **Directional icons need `rtl:-scale-x-100`** (arrows). Non-directional
   icons must not be mirrored.
3. **Latin runs inside Arabic need `dir="ltr"`** — tech badges, years, emails,
   phone numbers, URLs. Without it the bidi algorithm reorders them (e.g.
   `2024 — 2025` renders reversed in an RTL paragraph).
4. **Never force `dir="ltr"` on a string that contains Arabic.** That was the
   bug behind the hero role line and the footer; the fix was to keep such
   strings purely Latin, or drop the attribute.
5. **`.eyebrow` uses a monospace stack, which has no Arabic glyphs.** In RTL,
   `[dir='rtl'] .eyebrow:not([dir='ltr'])` swaps in the sans face and removes
   letter-spacing — Arabic is cursive and tracking visually breaks the joins.
   The `:not([dir='ltr'])` is what preserves the mono look for Latin badges.
6. **Tight letter-spacing on headings is Latin-only** — `[dir='rtl'] h1…h4`
   resets it to `normal`.

## Gotchas worth remembering

- **Modal overflow**: the dialog backdrop uses `items-start` plus `my-auto` on
  the panel, *not* `items-center`. A centred flex child taller than its scroll
  container has its top clipped and unreachable. Do not "simplify" this back.
- **Grids with a variable item count** leave a visible empty cell when they use
  the `gap-px` + background-colour divider trick. The modal metrics use flex
  for that reason; the skills grid uses `lg:last:col-span-3` to fill its last row.
- **Tailwind v4 scans the project for class names** and respects `.gitignore`.
  Without `dist` ignored it scans its own previous output and the CSS grows.
- **`npm run build` runs `prebuild`**, which regenerates `public/sitemap.xml`
  and `public/robots.txt` from `SITE_URL` in `src/data/site.ts`. One value,
  one place.
- **`assetUrl()`** (`src/lib/assets.ts`) must be used for anything in `/public`
  referenced from React, so GitHub Pages subpath deploys keep working.

## Content provenance

Everything is from `cv.pdf` except:

1. **`moreProjects` in `src/data/projects.ts`** — four public repositories on
   the GitHub account the CV links to, which are *not* listed in the CV. Each
   one-line description is taken from that repository's own README. Deleting an
   entry from the array removes it from the site.
2. **Repository READMEs** were used to add detail to the four featured
   projects, but only where it does not contradict the CV. Where they disagree,
   the CV wins. Two known disagreements are recorded in the handover notes:
   the School Management System's year, and whether the stock dataset is
   balanced.

Unresolved items are marked `TODO:` in the source — currently `SITE_URL` in
`src/data/site.ts` and `cv.ar` in `src/data/profile.ts`.

## Verifying changes

```bash
npm run build          # type-check + build; must pass before finishing
npm run preview        # then check EN/AR x light/dark, and a project modal
```

Worth re-checking after any layout change: no horizontal scroll at 390px wide,
WCAG AA contrast in both themes, the modal's top edge reachable when its
content is taller than the viewport, and Escape closing the modal and returning
focus to the card that opened it.
