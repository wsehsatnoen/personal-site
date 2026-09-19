'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'home' },
  { href: '/about', label: 'about' },
  { href: '/resume', label: 'resume'},
  { href: '/portfolio', label: 'portfolio' }
];

export default function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="wrap site-header">
      <Link href="/" className="wordmark">
        {name}
      </Link>
      <nav className="nav" aria-label="Primary">
        {NAV.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
