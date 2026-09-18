import Link from 'next/link';
import type { Project } from '@/lib/content';

export default function ProjectCard({ project }: { project: Project }) {
  const tone = project.featured ? 'olive' : 'chalk';
  const style = { '--span': project.span } as React.CSSProperties;

  const body = (
    <>
      <span className="card__kind">
        <span>{project.featured ? 'featured' : 'project'}</span>
        {!project.hasCaseStudy && project.link && (
          <span className="outbound" aria-hidden="true">
            &#8599;
          </span>
        )}
      </span>
      <span className="card__body">
        <span className="card__title">{project.title}</span>
        {project.description && <span className="card__desc">{project.description}</span>}
      </span>
      {project.stack.length > 0 && (
        <ul className="tags">
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </>
  );

  /* A project with a written case study links inward to it. One without
     links straight out to wherever the work lives. One with neither is
     just a card. */
  if (project.hasCaseStudy) {
    return (
      <Link
        className="card card--tall"
        data-tone={tone}
        style={style}
        href={`/portfolio/${project.slug}`}
      >
        {body}
      </Link>
    );
  }

  if (project.link) {
    return (
      <a
        className="card card--tall"
        data-tone={tone}
        style={style}
        href={project.link}
        target="_blank"
        rel="noreferrer noopener"
      >
        {body}
      </a>
    );
  }

  return (
    <div className="card card--tall" data-tone={tone} style={style}>
      {body}
    </div>
  );
}
