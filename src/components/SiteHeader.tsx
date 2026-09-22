'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
  cta?: boolean;
};

const NAV: NavItem[] = [
  { href: 'https://sso.wsehsatnoen.xyz', label: 'sso', external: true, cta: true },
  { href: '/about', label: 'About Me' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="wrap site-header">
      <Link href="/" className="wordmark">
        {name}
      </Link>
      <nav className="nav" aria-label="Primary">
        {NAV.map(({ href, label, external, cta }) => {
          const className = cta ? 'nav__cta' : undefined;

          if (external) {
            return (
              <a
                key={href}
                href={href}
                className={className}
                target="_blank"
                rel="noreferrer noopener"
              >
                {label}
              </a>
            );
          }

          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={className}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
