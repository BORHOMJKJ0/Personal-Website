import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { projectsByDate, type Project } from '@/data/projects';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { Section } from './Section';

/**
 * One grid, newest first. Featured projects carry a badge rather than sitting
 * in a separate block, so the ordering stays purely chronological.
 */
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
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projectsByDate.map((project, position) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={position}
              onOpen={() => setOpenProject(project)}
            />
          ))}
        </ul>
      </Section>

      {openProject ? (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      ) : null}
    </>
  );
}
