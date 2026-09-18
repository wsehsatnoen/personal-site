import { marked } from 'marked';
import type { Metadata } from 'next';
import { getMarkdownPage, getSite } from '@/lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { title: getSite().pages.resume.title };
}

export default async function ResumePage() {
  const { title, intro } = getSite().pages.resume;
  const body = getMarkdownPage('resume');
  const html = body ? await marked.parse(body) : '';

  return (
    <div className="wrap">
      <div className="intro">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>

      {html ? (
        <div className="prose resume" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="grid">
          <div className="card card--empty" style={{ '--span': 12 } as React.CSSProperties}>
            resume renders from content/resume.md
          </div>
        </div>
      )}
    </div>
  );
}
