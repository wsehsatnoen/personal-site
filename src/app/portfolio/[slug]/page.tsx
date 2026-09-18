import { marked } from 'marked';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProject } from '@/lib/content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project || !project.hasCaseStudy) notFound();

  const html = await marked.parse(project.body);

  return (
    <div className="wrap">
      <div className="intro">
        <h1>{project.title}</h1>
        {project.description && <p>{project.description}</p>}
      </div>

      {(project.stack.length > 0 || project.link) && (
        <div className="grid" style={{ marginBottom: '2.5rem' }}>
          <div className="card card--row" style={{ '--span': 12 } as React.CSSProperties}>
            {project.stack.length > 0 && (
              <ul className="tags">
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {project.link && (
              <a
                className="text-link"
                href={project.link}
                target="_blank"
                rel="noreferrer noopener"
              >
                view the source
              </a>
            )}
          </div>
        </div>
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      <p style={{ marginTop: '3rem' }}>
        <Link className="text-link" href="/portfolio">
          back to portfolio
        </Link>
      </p>
    </div>
  );
}
