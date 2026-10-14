/**
 * Project structure. Prose (title, tagline, problem, solution, role,
 * highlights) is keyed by `id` under `projects.items.<id>` in the locale files.
 *
 * Sources: cv.pdf is authoritative. Repository READMEs were used only to add
 * detail that does not contradict the CV:
 *   baraa            github.com/BORHOMJKJ0/Baraa          (public README)
 *   school-system    gitlab.com/BORHOMJKJ0/School_...     (public README)
 *   stock-prediction github.com/BORHOMJKJ0/NN_Project     (public README)
 *   trip-platform    private client project — CV only
 *
 * Media under /public/projects/<id>/ is produced by
 * scripts/capture-projects; see its README for how each one was captured.
 */

export type ProjectLink = {
  kind: 'github' | 'gitlab' | 'demo';
  url: string;
};

export type ProjectMedia = {
  /** Still shown on the card and as the first frame of the detail view. */
  cover: string;
  /** Extra screens for the detail view. */
  shots?: string[];
  /**
   * Looping demo. Plays on hover (desktop) or when scrolled into view
   * (mobile), and never under `prefers-reduced-motion`.
   */
  demo?: { webm: string; mp4?: string };
  /**
   * Why this media looks the way it does — a real capture, a diagram, or a
   * partial capture. Surfaced nowhere; it documents the asset for future runs.
   */
  note?: string;
};

export type Project = {
  id: string;
  /** Display string, from the CV where the CV states one. */
  year: string;
  /**
   * Sort key, newest first. Uses the CV's year where the CV gives one, and
   * repository activity otherwise. Not shown — `year` is what renders.
   */
  date: string;
  /** Shows a "featured" badge; the grid itself stays in date order. */
  featured?: boolean;
  /** Tech badges stay in English in both locales — they are product names. */
  stack: string[];
  links: ProjectLink[];
  /** Renders a "private repository" note instead of a link. */
  isPrivate?: boolean;
  /** Pulled out as big numbers on the detail view. Values come from the CV. */
  metrics?: { id: string; value: string }[];
  media?: ProjectMedia;
};

const MEDIA_ROOT = 'projects';

/**
 * Every project in one list, newest first. `featured` marks the four the CV
 * leads with; the other four are public repositories on the GitHub account the
 * CV links to, described from their own READMEs. Deleting an entry removes it
 * from the site.
 */
export const projects: Project[] = [
  {
    id: 'fp-ucp',
    year: '2026',
    date: '2026-05',
    stack: ['JavaScript', 'OpenRouter API', 'PDF export'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/fp-ucp-estimator' }],
    media: {
      cover: `${MEDIA_ROOT}/fp-ucp/cover.webp`,
      shots: [`${MEDIA_ROOT}/fp-ucp/shot-1.webp`],
      note: 'Prebuilt frontend served statically. The estimator calls OpenRouter with the visitor’s own key, so the setup screen is what can be shown.',
    },
  },
  {
    id: 'stock-prediction',
    year: '2026',
    date: '2026-02',
    featured: true,
    stack: [
      'Python',
      'PyTorch',
      'TCN',
      'Transformer',
      'BiLSTM',
      'NumPy',
      'Polars',
      'scikit-learn',
    ],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/NN_Project' }],
    metrics: [
      { id: 'accuracy', value: '58–62%' },
      { id: 'auc', value: '0.60–0.66' },
      { id: 'features', value: '60+' },
    ],
    media: {
      cover: `${MEDIA_ROOT}/stock-prediction/cover.webp`,
      note: 'Notebook project with no UI — diagram of the ensemble, drawn from the CV and repo README.',
    },
  },
  {
    id: 'sql-compiler',
    year: '2026',
    date: '2026-01',
    stack: ['Python', 'ANTLR'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/Compiler' }],
    media: {
      cover: `${MEDIA_ROOT}/sql-compiler/cover.webp`,
      shots: [`${MEDIA_ROOT}/sql-compiler/shot-1.webp`],
      note: 'The project’s own HTML tree visualiser, run on a short query so the tree fits. Token and error counts are real analyser output.',
    },
  },
  {
    id: 'mini-nn',
    year: '2026',
    date: '2026-01',
    stack: ['Python', 'NumPy'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/JKJMiniNN' }],
    media: {
      cover: `${MEDIA_ROOT}/mini-nn/cover.webp`,
      note: 'Library with no UI — panel reproduces a real `tests/run_all_tests.py` run (4/4 passing).',
    },
  },
  {
    id: 'automata',
    year: '2025',
    date: '2025-12',
    stack: ['Laravel 10', 'Dropbox API', 'PhpSpreadsheet', 'Bitrix24'],
    links: [
      { kind: 'github', url: 'https://github.com/BORHOMJKJ0/automata' },
      { kind: 'demo', url: 'https://automata-mu.vercel.app' },
    ],
    media: {
      cover: `${MEDIA_ROOT}/automata/cover.webp`,
      shots: [`${MEDIA_ROOT}/automata/shot-1.webp`, `${MEDIA_ROOT}/automata/shot-2.webp`],
      demo: {
        webm: `${MEDIA_ROOT}/automata/demo.webm`,
        mp4: `${MEDIA_ROOT}/automata/demo.mp4`,
      },
      note: 'Captured from the live deployment. The file browser itself sits behind Dropbox OAuth, so the public landing page is what is shown.',
    },
  },
  {
    id: 'baraa',
    year: '2024 — 2025',
    date: '2025-04',
    featured: true,
    stack: [
      'Laravel 10',
      'PHP 8.1+',
      'MySQL',
      'JWT',
      'RBAC',
      'Firebase FCM',
      'L5 Swagger',
      'Supabase',
    ],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/Baraa' }],
    metrics: [
      { id: 'endpoints', value: '150+' },
      { id: 'apps', value: '2' },
    ],
    media: {
      cover: `${MEDIA_ROOT}/baraa/cover.webp`,
      shots: [`${MEDIA_ROOT}/baraa/shot-1.webp`, `${MEDIA_ROOT}/baraa/shot-2.webp`],
      demo: { webm: `${MEDIA_ROOT}/baraa/demo.webm`, mp4: `${MEDIA_ROOT}/baraa/demo.mp4` },
      note: 'Backend-only, so the visual is its own generated OpenAPI reference, run locally against SQLite in a PHP 8.2 container.',
    },
  },
  {
    id: 'trip-platform',
    year: '2025',
    date: '2025-01',
    featured: true,
    stack: [
      'Laravel 10',
      'PHP',
      'Laravel Sanctum',
      'JWT',
      'Supabase',
      'PostgreSQL',
      'Firebase FCM',
      'Redis',
    ],
    links: [],
    isPrivate: true,
    media: {
      cover: `${MEDIA_ROOT}/trip-platform/cover.webp`,
      note: 'Private client project with no source access — architecture diagram drawn from the CV only.',
    },
  },
  {
    id: 'school-system',
    year: '2024',
    date: '2024-01',
    featured: true,
    stack: [
      'React',
      'Vite',
      'Tailwind CSS',
      'Zustand',
      'React Router',
      'Axios',
      'JWT',
      'Framer Motion',
    ],
    links: [
      { kind: 'gitlab', url: 'https://gitlab.com/BORHOMJKJ0/School_Management_System' },
    ],
    metrics: [
      { id: 'components', value: '20+' },
      { id: 'routes', value: '35' },
    ],
    media: {
      cover: `${MEDIA_ROOT}/school-system/cover.webp`,
      shots: [
        `${MEDIA_ROOT}/school-system/shot-1.webp`,
        `${MEDIA_ROOT}/school-system/shot-2.webp`,
      ],
      demo: {
        webm: `${MEDIA_ROOT}/school-system/demo.webm`,
        mp4: `${MEDIA_ROOT}/school-system/demo.mp4`,
      },
      note: 'Run from a clone against its mock API. The route guard rejects the mock token, so the dashboard needs the private Laravel backend — the real sign-in UI is what is shown.',
    },
  },
];

/** Newest first. The array above is already ordered; this keeps it honest. */
export const projectsByDate = [...projects].sort((a, b) => b.date.localeCompare(a.date));
