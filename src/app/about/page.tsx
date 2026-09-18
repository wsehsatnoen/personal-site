import { marked } from 'marked';
import type { Metadata } from 'next';
import { getMarkdownPage, getSite } from '@/lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { title: getSite().pages.about.title };
}

export default async function AboutPage() {
  const { title, intro } = getSite().pages.about;
  const body = getMarkdownPage('about');
  const html = body ? await marked.parse(body) : '';

  return (
    <div className="wrap">
      <div className="intro">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>

      {html ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="grid">
          <div className="card card--empty" style={{ '--span': 12 } as React.CSSProperties}>
            page copy renders from content/about.md
          </div>
        </div>
      )}
    </div>
  );
}
