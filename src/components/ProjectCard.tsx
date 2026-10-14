import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, ExternalLink, Lock, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Project } from '@/data/projects';
import { useReveal } from '@/hooks/useReveal';
import { Badge } from './Badge';
import { GitHubIcon, GitLabIcon } from './BrandIcons';
import { ProjectMedia } from './ProjectMedia';
import { AnimatedText } from './AnimatedText';
import { usePointerTilt } from '@/hooks/usePointerTilt';

const REPO_ICON = { github: GitHubIcon, gitlab: GitLabIcon, demo: ExternalLink } as const;

/**
 * A card carries everything worth knowing at a glance: cover (or looping
 * demo), title, one-line description, stack and links. The detail view adds
 * depth but hides nothing essential.
 */
export function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const ref = useReveal<HTMLLIElement>();
  const tilt = usePointerTilt<HTMLLIElement>();
  const [hovered, setHovered] = useState(false);
  const base = `projects.items.${project.id}`;
  const title = t(`${base}.title`);

  const linkLabel = (kind: Project['links'][number]['kind']) =>
    kind === 'github'
      ? t('projects.viewOnGithub')
      : kind === 'gitlab'
        ? t('projects.viewOnGitlab')
        : t('projects.viewDemo');

  return (
    <li
      ref={ref}
      className="reveal motion-cascade tilt-card group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-card"
      {...tilt}
      style={{ '--reveal-delay': `${Math.min(index, 5) * 60}ms` } as CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      {project.media ? (
        <div className="relative border-b border-line">
          <ProjectMedia
            media={project.media}
            alt={t('projects.coverAlt', { title })}
            hovered={hovered}
            eager={index < 2}
          />

        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/*
          Badges sit in the body rather than over the cover: several covers are
          diagrams whose own title occupies the top-left corner.
        */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="eyebrow text-accent" dir="ltr">
            <AnimatedText>{project.year}</AnimatedText>
          </span>
          {project.featured ? (
            <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-accent-fg">
              <Star className="size-2.5 fill-current" aria-hidden="true" />
              {t('projects.featuredBadge')}
            </span>
          ) : null}
          {project.isPrivate ? (
            <span className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-fg-subtle">
              <Lock className="size-2.5" aria-hidden="true" />
              {t('projects.privateRepo')}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2.5 text-lg leading-snug font-semibold text-fg sm:text-xl">
          {/*
            The heading is the dialog trigger, so each card has one obvious
            target and the repo links stay separately focusable.
          */}
          <button
            type="button"
            onClick={onOpen}
            className="text-start transition-colors group-hover:text-accent"
          >
            <AnimatedText>{title}</AnimatedText>
            <span className="sr-only"> — {t('projects.viewDetails')}</span>
          </button>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(`${base}.tagline`)}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
          {project.stack.length > 4 ? (
            <li>
              <Badge>+{project.stack.length - 4}</Badge>
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4">
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
              return (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex size-9 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-alt hover:text-accent"
                    aria-label={`${title} — ${linkLabel(link.kind)} (${t('a11y.opensInNewTab')})`}
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
