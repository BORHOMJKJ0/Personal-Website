import { useEffect, useRef } from 'react';
import { ArrowUpRight, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Project } from '@/data/projects';
import { Badge } from './Badge';
import { GitHubIcon, GitLabIcon } from './BrandIcons';

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

const LINK_ICON = { github: GitHubIcon, gitlab: GitLabIcon, demo: ArrowUpRight } as const;

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const base = `projects.items.${project.id}`;
  const has = (key: string) => i18n.exists(`${base}.${key}`);
  const highlights = (
    i18n.t(`${base}.highlights`, { returnObjects: true, defaultValue: [] }) as string[]
  ).filter((line) => typeof line === 'string');

  // Lock the page behind the dialog without the layout shifting as the
  // scrollbar disappears.
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingInlineEnd;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingInlineEnd = `${scrollbar}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingInlineEnd = previousPadding;
    };
  }, []);

  // Move focus in, trap Tab inside the panel, and close on Escape.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      /*
        `items-start` + `my-auto` on the panel, rather than `items-center`:
        a centred flex child taller than the scroll container has its top
        clipped and unreachable. Auto margins centre it only when it fits.
      */
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-fg/40 p-0 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${project.id}-dialog-title`}
        className="relative mt-auto w-full max-w-3xl rounded-t-2xl border border-line bg-bg shadow-card sm:my-auto sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start gap-4 rounded-t-2xl border-b border-line bg-bg/95 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent" dir="ltr">
              {project.year}
            </p>
            <h2
              id={`${project.id}-dialog-title`}
              className="mt-1.5 text-xl leading-snug font-semibold text-fg sm:text-2xl"
            >
              {t(`${base}.title`)}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            aria-label={t('a11y.closeDialog')}
          >
            <X className="size-[1.05rem]" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-8 px-5 py-7 sm:px-8 sm:py-8">
          <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
            {t(`${base}.tagline`)}
          </p>

          {project.metrics?.length ? (
            // Flex rather than a grid: the metric count varies by project, and a
            // grid leaves a visible empty cell whenever it does not divide evenly.
            <dl className="flex flex-wrap gap-3">
              {project.metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="min-w-36 flex-1 rounded-xl border border-line bg-surface px-4 py-4"
                >
                  <dd
                    dir="ltr"
                    className="font-display text-2xl font-bold text-fg sm:text-[1.75rem]"
                  >
                    {metric.value}
                  </dd>
                  <dt className="mt-1 text-xs leading-snug text-fg-subtle">
                    {t(`projects.metrics.${metric.id}`)}
                  </dt>
                </div>
              ))}
            </dl>
          ) : null}

          <Block label={t('projects.problemLabel')}>{t(`${base}.problem`)}</Block>
          <Block label={t('projects.solutionLabel')}>{t(`${base}.solution`)}</Block>
          {has('results') ? (
            <Block label={t('projects.resultsLabel')}>{t(`${base}.results`)}</Block>
          ) : null}
          <Block label={t('projects.roleLabel')}>{t(`${base}.role`)}</Block>

          {highlights.length ? (
            <div>
              <h3 className="eyebrow text-fg-subtle">{t('projects.highlightsLabel')}</h3>
              <ul className="mt-3 space-y-2.5">
                {highlights.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                    <span
                      className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="eyebrow text-fg-subtle">{t('projects.stackLabel')}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <li key={tech}>
                  <Badge>{tech}</Badge>
                </li>
              ))}
            </ul>
          </div>

          {has('note') ? (
            <p className="rounded-xl border border-line bg-surface-alt px-4 py-3.5 text-sm leading-relaxed text-fg-subtle">
              <span className="eyebrow me-2 text-fg-muted">{t('projects.noteLabel')}</span>
              {t(`${base}.note`)}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {project.links.map((link) => {
              const Icon = LINK_ICON[link.kind];
              const label =
                link.kind === 'github'
                  ? t('projects.viewOnGithub')
                  : link.kind === 'gitlab'
                    ? t('projects.viewOnGitlab')
                    : t('projects.viewDemo');
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                  <span className="sr-only"> ({t('a11y.opensInNewTab')})</span>
                </a>
              );
            })}
            {project.isPrivate ? (
              <p className="inline-flex items-center gap-2 text-sm text-fg-subtle">
                <Lock className="size-4" aria-hidden="true" />
                {t('projects.sourceOnRequest')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow text-fg-subtle">{label}</h3>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-base">{children}</p>
    </div>
  );
}
