import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { getSite } from '@/lib/content';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { title: getSite().pages.contact.title };
}

export default function ContactPage() {
  const { title, intro } = getSite().pages.contact;

  return (
    <div className="wrap">
      <div className="intro">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>

      <div className="grid">
        <div
          className="card"
          data-tone="forest"
          style={{ '--span': 7, padding: '2rem' } as React.CSSProperties}
        >
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
