# capture-projects

Build-time tooling that produces the portfolio's media. **Nothing here ships to
the browser** — it has its own `package.json` so Playwright and sharp never
become dependencies of the site.

```bash
cd scripts/capture-projects
npm install
npx playwright install chromium
```

## Commands

| Command | What it does |
| --- | --- |
| `node capture.mjs` | Capture every project into `public/projects/<slug>/` |
| `node capture.mjs automata baraa` | Capture only the named targets |
| `node logos.mjs` | Fetch organisation logos into `public/logos/` |
| `node assets.mjs` | Normalise the university logo, regenerate the placeholder avatar |
| `node portfolio-shots.mjs [url] [outDir]` | Screenshot the portfolio in EN/AR × light/dark × mobile/desktop, with a `report.json` |
| `node check-motion.mjs [url]` | Verify counters, typing, floating chips and hover video — and that reduced motion disables them |
| `node explore.mjs <url>` | Print a page's routes, headings and buttons (used when planning a capture) |
| `node crop.mjs <png> <outDir> [slice]` | Slice a tall screenshot into reviewable pieces |

`capture.mjs` isolates each target: one project that will not boot is reported
and the rest continue.

## Per-project capture notes

Each entry in `targets.mjs` carries a comment explaining how it is reached.
The ones that need setup outside this folder:

**`baraa`** — backend only, so the visual is its own generated OpenAPI
reference. Laravel 10 does not support PHP 8.5, so it runs in a container.
`php:8.2-cli` already has every extension Laravel needs, so the image only adds
`unzip`, `git` and Composer:

```dockerfile
FROM php:8.2-cli
RUN apt-get update && apt-get install -y --no-install-recommends unzip git \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
ENV COMPOSER_ALLOW_SUPERUSER=1
```

Then, from a clone, with MySQL swapped for SQLite in `.env`
(`DB_CONNECTION=sqlite`, `DB_DATABASE=/app/database/database.sqlite`):

```bash
docker run --rm -v "$PWD:/app" -w /app baraa-capture:php82 \
  composer install --ignore-platform-req=ext-zip
touch database/database.sqlite
docker run --rm -v "$PWD:/app" -w /app baraa-capture:php82 sh -lc '
  php artisan key:generate --force && php artisan jwt:secret --force
  php artisan migrate --force && php artisan db:seed --force
  php artisan l5-swagger:generate'
docker run -d --rm --name baraa-serve -p 8088:8000 -v "$PWD:/app" -w /app \
  baraa-capture:php82 php artisan serve --host 0.0.0.0 --port 8000

BARAA_URL=http://127.0.0.1:8088 node capture.mjs baraa
```

**`school-system`** — run the clone's frontend with its mock API
(`.env.development.local` containing `VITE_USE_MOCK_API=true`; note that
`.env.development` outranks `.env.local` in Vite, so the `.development.local`
name matters), then `npm run dev` and capture against `localhost:5173`.

**`sql-compiler`** — the project ships its own HTML tree visualiser. Call its
`process_file()` + `create_tree_visualization()` on a short query so the tree
fits the frame, write the HTML, then:

```bash
COMPILER_VIZ=file:///path/to/viz.html node capture.mjs sql-compiler
```

**`fp-ucp`** — the repo ships a prebuilt frontend, so no build step is needed:

```bash
FPUCP_BUILD=/path/to/clone/frontend/build node capture.mjs fp-ucp
```

**`stock-prediction`, `trip-platform`, `mini-nn`** — no runnable UI. These
render an HTML template from `templates/`, styled to match the portfolio's
light palette, and screenshot it. Edit the template and re-run to change them.

## Rules this tooling follows

- Clones live in a temp directory and are deleted afterwards. Nothing from a
  cloned repository — source, `.env`, database — is ever written into this one.
- Videos are recorded by driving frames and encoding with the system ffmpeg,
  not Playwright's recorder, so clips are deterministic and do not depend on
  Playwright's bundled ffmpeg revision. Each is capped at 1.5 MB.
- Covers are 1280×800 WebP; demos are WebM with an MP4 fallback for Safari.
