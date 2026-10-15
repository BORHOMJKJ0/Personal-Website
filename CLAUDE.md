# CLAUDE.md

Context for future sessions on this repository.

## What this is

Omar Borhom's personal portfolio site. Single page, static, no backend.
Bilingual English/Arabic with full RTL, dark/light themes.

**The CV at `./cv.pdf` is the source of truth for all content.** Nothing on the
site states a fact, number or achievement that is not in that PDF, with two
deliberate, documented exceptions (see *Content provenance* below). Do not add
claims that the CV does not support.

## Three things that must not change

1. **Vercel is the only deploy target.** Live at <https://omar-borhom.vercel.app>;
   push to `main` and it deploys. There is no GitHub Actions workflow and no
   `.github/` directory — a GitHub Pages workflow used to exist and was removed
   because Pages was never enabled, so every run failed at
   `actions/configure-pages`. Do not re-add one.
2. **The Vite `base` is `'/'`, hard-coded.** It is deliberately not read from an
   env var any more. A sub-path base (`/Personal-Website/`) breaks every asset
   URL on Vercel.
3. **English is the default language.** See *Language* below.

## Stack

| Choice | Version | Why |
| --- | --- | --- |
| React | 19 | — |
| Vite | 8 (rolldown) | Static output, fast builds |
| TypeScript | 7 | Note: `baseUrl` was **removed** in TS 7; `paths` in `tsconfig.app.json` resolve relative to the tsconfig file |
| Tailwind CSS | 4 | CSS-first config via `@theme inline` (fonts: plain `@theme`, see *Fonts*), no `tailwind.config.js` |
| react-i18next | 17 | Two bundled JSON locales, no lazy loading (they are small) |
| lucide-react | 1 | UI icons only — **v1 dropped all brand icons**, so GitHub/GitLab/LinkedIn are inline SVG in `src/components/BrandIcons.tsx` |

No router (single page, anchor navigation), no animation library, no component
library.

**Motion is hand-rolled on purpose.** No animation library — CSS transitions,
IntersectionObserver and requestAnimationFrame cover everything at 0 KB. Do
not add one without a reason that this cannot cover.

**Everything goes through `src/motion/`.**
- `tokens.ts` / `motion.css` — the only timing values on the site: durations
  fast 150 / base 300 / slow 600 / hero 900 ms, three easings, a 60 ms
  stagger, loop lengths as multiples of `hero`. The two files must agree;
  `check-motion.mjs` compares them against the rendered page. No literal
  durations in components or CSS outside `motion.css`.
- Hooks: `useReveal` / `useInView`, `usePointer` (tilt + spotlight vars),
  `useReducedMotion`, `useFinePointer` / `useIsTouch`, `useTabVisible`,
  `useLoopPause`, `useDirectionSign`.
- Animate transform, opacity and filter only.
- Continuous loops carry `.motion-loop`; `useLoopPause` on their section sets
  `data-motion-paused` when it is off screen or the tab is hidden, and CSS
  pauses them. JS loops (typing) take the hook's return value.
- Horizontal motion multiplies by `--dir` (CSS) or `useDirectionSign()` (JS)
  so it mirrors in Arabic.
- Headings animate per **word**, never per letter (Arabic must stay joined,
  and letter-level motion was judged too noisy). The hero name uses
  `<AnimatedText rise>`: opaque from the first frame, words only rise.
- Counters are digit reels that roll once, then swap to plain text
  (`data-counter-phase`: idle → rolling → done) so the settled number is
  crisp and on one baseline.

**Reduced motion:** nothing continuous or pointer-driven, content visible
immediately, short opacity fades only for UI state (menu, dialog). The safety
net is a zero-specificity `:where(*)` rule in `motion.css` — not in
`@layer base`, where its `!important` would beat every later opt-out.

Run after touching anything animated (preview server on :4173):
`check-motion.mjs` (motion system, normal + reduced, EN/AR × 390/1440) and
`check-site-motion.mjs` (every section, logos, dialog, language switch).
Both wait on observable conditions — keep it that way; fixed sleeps made
the old checks flaky.

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

**Language: English is the default, and the browser locale is never consulted.**
Resolution order, duplicated in `detectLanguage()` (`src/i18n/index.ts`) and the
inline script in `index.html`:

`?lang=` query → `localStorage` → `'en'`

Arabic is shown only when it is explicitly asked for — the header toggle, or a
`?lang=ar` URL — and the toggle choice persists in `localStorage`. An earlier
version fell back to `navigator.language`, which meant Arabic-locale visitors
landed on the Arabic site; that was removed on purpose, so do not reintroduce a
`navigator.language` check. `index.html` ships `lang="en" dir="ltr"` and the
inline script only changes it when one of the two explicit signals is present.

The `?lang=ar` query param exists so each language has a real, shareable URL
for the hreflang alternates; `useLanguage` keeps it in sync via
`history.replaceState`. `vercel.json` also redirects `/ar` → `/?lang=ar` and
`/en` → `/` so those short paths work.

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

## Fonts

Self-hosted WOFF2 in `src/assets/fonts/` (OFL licences beside them), declared
in `src/fonts.css`. **Do not re-add Google Fonts** — its render-blocking
stylesheet and late swap were the whole of the mobile CLS (0.14) and most of
the FCP; self-hosting took local mobile Lighthouse from 87 to 96.

- Subsets split by script. English pages fetch only Inter + Space Grotesk;
  Arabic pages only IBM Plex Sans Arabic (Arabic + its Latin subset). Keep it
  that way: no Latin family in the Arabic stack, no Arabic family in the
  English stack. The language toggle's "العربية" label uses the system Arabic
  face for the same reason (`.lang-label-ar`).
- The inline head script preloads two faces for the current language. Their
  hashed URLs are injected at build time by `fontPreloads()` in
  `vite.config.ts` (the `__FONT_PRELOADS__` placeholder).
- Each family has a metric-matched local fallback (`* Fallback` faces, one
  per weight band). If you swap a font, recompute its overrides; the numbers
  and their source are in the comment in `fonts.css`.
- Font tokens live in a plain `@theme`, not `@theme inline`: inlined, the
  `font-display` utility carried the Latin stack into Arabic pages.
- `scripts/capture-projects/check-fonts.mjs` asserts all of the above and
  CLS ≤ 0.02 on a throttled connection.

## Gotchas worth remembering

- **Modal overflow**: the dialog backdrop uses `items-start` plus `my-auto` on
  the panel, *not* `items-center`. A centred flex child taller than its scroll
  container has its top clipped and unreachable. Do not "simplify" this back.
- **Grids with a variable item count** leave a visible empty cell when they use
  the `gap-px` + background-colour divider trick. The modal metrics use flex
  for that reason; the skills grid uses `lg:last:col-span-3` to fill its last row.
- **Tailwind v4 scans the project for class names** and respects `.gitignore`.
  Without `dist` ignored it scans its own previous output and the CSS grows.
  The same applies to `artifacts/` (local audit output), which is why it is
  ignored too.
- **`npm run build` runs `prebuild`**, which regenerates `public/sitemap.xml`
  and `public/robots.txt` from `SITE_URL` in `src/data/site.ts`. One value,
  one place.
- **Never set `cleanUrls: true` in `vercel.json`.** It turns `/index.html` into
  a 308 redirect to `/`, which makes the SPA rewrite's destination
  unresolvable, and every deep link 404s with `X-Vercel-Error: NOT_FOUND`.
  It buys nothing for a single-page app. Also note `vercel.json` is schema-
  validated and rejects unknown keys, so it cannot carry `_comment` fields —
  notes about it belong here.
- **Verify routing against the deployed site, not `vite preview`.** Preview has
  its own SPA fallback and happily serves deep links even when the Vercel
  rewrite is broken. The cleanUrls bug above passed locally and only showed up
  on a live `curl`.
- **`assetUrl()`** (`src/lib/assets.ts`) is how anything in `/public` is
  referenced from React. With `base: '/'` it only normalises the leading slash,
  but routing through `BASE_URL` keeps the links honest if the base ever moves.

## Project media

Covers, extra screens and demos live in `public/projects/<id>/` and are
declared in each project's `media` field. They are produced by
`scripts/capture-projects/`, which has **its own package.json** — Playwright
and sharp must never become dependencies of the site. Each target in
`targets.mjs` carries a comment saying how that project was reached, and the
folder's README has the setup for the ones needing a container or a clone.

Three projects have no runnable UI (`stock-prediction`, `trip-platform`,
`mini-nn`) and render HTML templates from `templates/` instead, styled to match
the site's light palette so a diagram sits beside a screenshot without looking
foreign.

Rules: clones live in a temp directory and are deleted afterwards; nothing from
a cloned repo — source, `.env`, database — is written into this one.

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

The Arabic rendering of the name is **عمر برهم**, as corrected by the owner. Keep
it consistent across `hero.name`, `nav.brandAria`, `meta.title` and
`footer.builtBy` in `ar.json`.

The hero typing phrases are Backend Developer / Full-Stack Developer /
AI & Deep Learning Developer (owner's choice, Oct 2026), each backed by the CV:
its title, the AI degree and the deep learning projects.

Counter values in `heroStats` are either stated in the CV (150+ endpoints, 20+
components, 60+ indicators) or counted from `src/data/projects.ts` (project
count). Do not add a counter whose number cannot be traced to one of those.

Services in `src/data/services.ts` are drawn from the CV's TECHNICAL SKILLS and
EXPERIENCE sections — they describe work the CV evidences, not an aspirational
menu.

Two `TODO:`s remain in the source:
- `cv.ar` in `src/data/profile.ts` — `null`, which hides the Arabic CV button
  rather than linking a missing file. Set it to `'cv-ar.pdf'` once that file
  exists in `/public`.
- `maps` in `src/data/orgs.ts` — no official logo could be sourced
  (multiaidprograms.org is behind a bot challenge a real browser could not
  clear either, and it is not on Wikimedia), so it renders an initials badge.

## Verifying changes

```bash
npm ci
npm run build          # type-check + build; must pass with no warnings
npm run typecheck
npm run lint           # needs `npm ci --prefix scripts/lint` once (see below)
npm run preview        # then check EN/AR x light/dark, and a project modal
```

**Lint** lives in `scripts/lint/` with its own package.json: typescript-eslint
needs TypeScript's JS API (<6.1), which TypeScript 7 no longer ships, so that
folder carries TypeScript 6 purely as ESLint's parser. The site still builds
and type-checks with 7. Rules are syntactic (no type info) plus React hooks.

**Playwright scripts** (`scripts/capture-projects/`) launch the full Chromium
build explicitly; the headless-shell build is often not installed.

**npm on this machine** times out on IPv6. If installs hang, run them with
`NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"`.

Worth re-checking after any layout change: no horizontal scroll at 390px wide,
WCAG AA contrast in both themes, the modal's top edge reachable when its
content is taller than the viewport, and Escape closing the modal and returning
focus to the card that opened it.

For the language default specifically, a real check means overriding
`navigator.language` to `ar-SY` *before* page scripts run (CDP
`Page.addScriptToEvaluateOnNewDocument`) and confirming `<html>` still comes up
`lang="en" dir="ltr"`. Setting a CDP locale override alone does not change
`navigator.language` and will silently pass.
