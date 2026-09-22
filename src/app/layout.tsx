import type { Metadata } from 'next';
import { Newsreader, DM_Mono } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getSite } from '@/lib/content';
import './globals.css';
import Script from 'next/script';

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
});

export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    title: { default: site.name, template: `%s — ${site.name}` },
    description: site.tagline,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSite();

  return (
    <html lang="en" className={`${newsreader.variable} ${dmMono.variable}`}>
      <body>
        <div className="page">
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader name={site.name} />
          <main id="main">{children}</main>
          <SiteFooter name={site.name} links={site.footer.links} />
        </div>

        <script defer src="https://stats.wsehsatnoen.xyz/script.js" data-website-id="85ad824c-e751-4d10-9a81-2fb6dd85729f"></script>
      </body>
    </html>
  );
}
