/**
 * Project structure. Prose (title, summary, problem, solution, role,
 * highlights) is keyed by `id` under `projects.<id>` in the locale files.
 *
 * Sources: cv.pdf is authoritative. Repository READMEs were used only to add
 * detail that does not contradict the CV:
 *   baraa            github.com/BORHOMJKJ0/Baraa          (public README)
 *   school-system    gitlab.com/BORHOMJKJ0/School_...     (public README)
 *   stock-prediction github.com/BORHOMJKJ0/NN_Project     (public README)
 *   trip-platform    private client project — CV only
 */

export type ProjectLink = {
  kind: 'github' | 'gitlab' | 'demo';
  url: string;
};

export type Project = {
  id: string;
  year: string;
  /** Tech badges stay in English in both locales — they are product names. */
  stack: string[];
  links: ProjectLink[];
  /** Renders a "private repository" note instead of a link. */
  isPrivate?: boolean;
  /** Pulled out as big numbers on the detail view. Values come from the CV. */
  metrics?: { id: string; value: string }[];
};

export const featuredProjects: Project[] = [
  {
    id: 'trip-platform',
    year: '2025',
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
  },
  {
    id: 'baraa',
    year: '2024 — 2025',
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
  },
  {
    id: 'stock-prediction',
    year: '2026',
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
  },
  {
    id: 'school-system',
    year: '2024',
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
  },
];

/**
 * Compact list. These repositories are public on the GitHub account linked in
 * the CV but are NOT listed in the CV itself; each line below is taken from the
 * repository's own README. Delete an entry to drop it from the site.
 */
export const moreProjects: Project[] = [
  {
    id: 'sql-compiler',
    year: '2026',
    stack: ['Python', 'ANTLR'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/Compiler' }],
  },
  {
    id: 'mini-nn',
    year: '2026',
    stack: ['Python', 'NumPy'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/JKJMiniNN' }],
  },
  {
    id: 'fp-ucp',
    year: '2026',
    stack: ['JavaScript', 'OpenRouter API', 'PDF export'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/fp-ucp-estimator' }],
  },
  {
    id: 'automata',
    year: '2025',
    stack: ['Laravel 10', 'Dropbox API', 'PhpSpreadsheet', 'Bitrix24'],
    links: [{ kind: 'github', url: 'https://github.com/BORHOMJKJ0/automata' }],
  },
];
