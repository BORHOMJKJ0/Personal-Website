import { useState } from 'react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { featuredProjects, moreProjects, type Project } from '@/data/projects';
import { useReveal } from '@/hooks/useReveal';
import { Badge } from './Badge';
import { GitHubIcon, GitLabIcon } from './BrandIcons';
import { ProjectModal } from './ProjectModal';
import { Section, SectionRule } from './Section';

const REPO_ICON = { github: GitHubIcon, gitlab: GitLabIcon, demo: ArrowUpRight } as const;

export function Projects({ index }: { index: number }) {
  const { t } = useTranslation();
  const [openProject, setOpenProject] = useState<Project | null>(null);

  return (
    <>
      <Section
        id="projects"
        index={index}
        eyebrow={t('projects.eyebrow')}
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
      >
        <ul className="grid gap-5 sm:grid-cols-2">
          {featuredProjects.map((project, position) => (
            <FeaturedCard
              key={project.id}
              project={project}
              position={position}
              onOpen={() => setOpenProject(project)}
            />
          ))}
        </ul>

        <div className="mt-20">
          <SectionRule index="+" eyebrow={t('projects.moreTitle')} />
          <p className="mt-4 text-sm text-fg-muted">{t('projects.moreSubtitle')}</p>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {moreProjects.map((project) => (
              <MoreRow key={project.id} project={project} />
            ))}
          </ul>
        </div>
      </Section>

      {openProject ? (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      ) : null}
    </>
  );
}

function FeaturedCard({
  project,
  position,
  onOpen,
}: {
  project: Project;
  position: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const ref = useReveal<HTMLLIElement>();
  const base = `projects.items.${project.id}`;

  return (
    <li
      ref={ref}
      className="reveal group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
      // A small stagger reads as one motion rather than four.
      style={{ transitionDelay: `${Math.min(position, 3) * 60}ms` }}
    >
      {/* Accent spine on the inline-start edge — mirrors automatically in RTL. */}
      <span
        className="absolute inset-y-0 start-0 w-0.5 bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow text-accent" dir="ltr">
            {project.year}
          </span>
          {project.isPrivate ? (
            <span className="eyebrow inline-flex items-center gap-1.5 text-fg-subtle">
              <Lock className="size-3" aria-hidden="true" />
              {t('projects.privateRepo')}
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl leading-snug font-semibold text-fg">
          {/*
            The heading is the button, so the dialog has exactly one obvious
            trigger per card and repo links stay separately focusable.
          */}
          <button
            type="button"
            onClick={onOpen}
            className="text-start transition-colors group-hover:text-accent"
          >
            {t(`${base}.title`)}
            <span className="sr-only"> — {t('projects.viewDetails')}</span>
          </button>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t(`${base}.tagline`)}</p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 5).map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
          {project.stack.length > 5 ? (
            <li>
              <Badge>+{project.stack.length - 5}</Badge>
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg transition-colors hover:text-accent"
          >
            {t('projects.viewDetails')}
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
              aria-hidden="true"
            />
          </button>

          <ul className="flex items-center gap-1">
            {project.links.map((link) => {
              const Icon = REPO_ICON[link.kind];
              const label =
                link.kind === 'github'
                  ? t('projects.viewOnGithub')
                  : link.kind === 'gitlab'
                    ? t('projects.viewOnGitlab')
                    : t('projects.viewDemo');
              return (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex size-9 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-alt hover:text-accent"
                    aria-label={`${t(`${base}.title`)} — ${label} (${t('a11y.opensInNewTab')})`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}

function MoreRow({ project }: { project: Project }) {
  const { t } = useTranslation();
  const base = `projects.items.${project.id}`;
  const link = project.links[0];
  const Icon = link ? REPO_ICON[link.kind] : null;

  return (
    <li>
      <a
        href={link?.url ?? '#projects'}
        target={link ? '_blank' : undefined}
        rel={link ? 'noreferrer noopener' : undefined}
        className="group flex items-start gap-4 py-5 transition-colors hover:bg-surface-alt sm:items-center sm:gap-6"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="text-base font-semibold text-fg transition-colors group-hover:text-accent">
              {t(`${base}.title`)}
            </h4>
            <span className="eyebrow text-fg-subtle" dir="ltr">
              {project.year}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t(`${base}.tagline`)}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <li key={tech}>
                <Badge>{tech}</Badge>
              </li>
            ))}
          </ul>
        </div>

        {Icon ? (
          <span
            className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-subtle transition-colors group-hover:border-accent group-hover:text-accent sm:mt-0"
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
        ) : null}
        {link ? <span className="sr-only">({t('a11y.opensInNewTab')})</span> : null}
      </a>
    </li>
  );
}
