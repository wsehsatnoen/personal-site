import LinkCard from '@/components/LinkCard';
import { getLinks, getSite } from '@/lib/content';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const site = getSite();
  const links = getLinks();

  return (
    <div className="wrap">
      <div className="intro intro--home">
        <h1>{site.name}</h1>
        {site.tagline && <p>{site.tagline}</p>}
      </div>

      {links.length > 0 ? (
        <div className="grid">
          {links.map((card) => (
            <LinkCard key={`${card.href}-${card.label}`} card={card} />
          ))}
        </div>
      ) : (
        <div className="grid">
          <div className="card card--empty" style={{ '--span': 12 } as React.CSSProperties}>
            cards render from content/links.yml
          </div>
        </div>
      )}
    </div>
  );
}
