import Link from 'next/link';
import type { LinkCard as LinkCardData } from '@/lib/content';

/* One destination on the homepage. Span and tone come straight from
   content/links.yml, so the composition is editable without touching JSX. */
export default function LinkCard({ card }: { card: LinkCardData }) {
  const isRow = card.span >= 5;
  const className = ['card', isRow ? 'card--row' : 'card--tall'].join(' ');
  const style = { '--span': card.span } as React.CSSProperties;

  const mark = card.external ? (
    <span className="outbound" aria-hidden="true">
      &#8599;
    </span>
  ) : null;

  const inner = isRow ? (
    <>
      <span className="card__lead">
        <span className="card__kind">
          <span>{card.kind}</span>
        </span>
        <span className="card__title">{card.label}</span>
      </span>
      <span className="card__lead">
        {card.description && <span className="card__desc">{card.description}</span>}
        {mark}
      </span>
    </>
  ) : (
    <>
      <span className="card__kind">
        <span>{card.kind}</span>
        {mark}
      </span>
      <span className="card__body">
        <span className="card__title">{card.label}</span>
        {card.description && <span className="card__desc">{card.description}</span>}
      </span>
    </>
  );

  if (card.external) {
    return (
      <a
        className={className}
        data-tone={card.tone}
        style={style}
        href={card.href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {inner}
        <span className="trap">opens in a new tab</span>
      </a>
    );
  }

  return (
    <Link className={className} data-tone={card.tone} style={style} href={card.href}>
      {inner}
    </Link>
  );
}
