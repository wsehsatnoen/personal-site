import type { FooterLink } from '@/lib/content';

export default function SiteFooter({ name, links }: { name: string; links: FooterLink[] }) {
  return (
    <footer className="wrap site-footer">
      <span>
        {name}, {new Date().getFullYear()}
      </span>
      {links.length > 0 && (
        <div className="footer-links">
          {links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer noopener">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
}
