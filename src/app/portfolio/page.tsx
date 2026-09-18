import type { Metadata } from 'next';
import ProjectCard from '@/components/ProjectCard';
import { getProjects, getSite } from '@/lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { title: getSite().pages.portfolio.title };
}

export default function PortfolioPage() {
  const { title, intro } = getSite().pages.portfolio;
  const projects = getProjects();

  return (
    <div className="wrap">
      <div className="intro">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>

      <div className="grid">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="card card--empty" style={{ '--span': 12 } as React.CSSProperties}>
            each file in content/projects renders as a card here
          </div>
        )}
      </div>
    </div>
  );
}
