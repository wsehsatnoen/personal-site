import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export type Tone = 'chalk' | 'forest' | 'camel' | 'sage' | 'olive';

export interface FooterLink {
  label: string;
  href: string;
}

export interface PageCopy {
  title: string;
  intro: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  pages: Record<'about' | 'portfolio' | 'resume' | 'contact', PageCopy>;
  footer: { links: FooterLink[] };
}

export interface LinkCard {
  label: string;
  kind: string;
  href: string;
  description: string;
  span: number;
  tone: Tone;
  external: boolean;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  link: string;
  featured: boolean;
  span: number;
  order: number;
  body: string;
  hasCaseStudy: boolean;
}

const FALLBACK_SITE: SiteConfig = {
  name: 'Your Name',
  tagline: '',
  pages: {
    about: { title: 'About', intro: '' },
    portfolio: { title: 'Portfolio', intro: '' },
    resume: { title: 'Resume', intro: '' },
    contact: { title: 'Contact', intro: '' },
  },
  footer: { links: [] },
};

function readYaml<T>(file: string): T | null {
  const full = path.join(CONTENT_DIR, file);
  if (!fs.existsSync(full)) return null;
  try {
    return yaml.load(fs.readFileSync(full, 'utf8')) as T;
  } catch (err) {
    console.error(`content: could not parse ${file}`, err);
    return null;
  }
}

/* A card that spans fewer than 3 or more than 12 columns breaks the grid,
   so clamp rather than trusting whatever ends up in the YAML. */
function clampSpan(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(12, Math.max(3, Math.round(n)));
}

const TONES: Tone[] = ['chalk', 'forest', 'camel', 'sage', 'olive'];

function toTone(value: unknown, fallback: Tone = 'chalk'): Tone {
  return TONES.includes(value as Tone) ? (value as Tone) : fallback;
}

export function getSite(): SiteConfig {
  const raw = readYaml<Partial<SiteConfig>>('site.yml');
  if (!raw) return FALLBACK_SITE;
  return {
    name: raw.name ?? FALLBACK_SITE.name,
    tagline: raw.tagline ?? '',
    pages: { ...FALLBACK_SITE.pages, ...(raw.pages ?? {}) },
    footer: { links: raw.footer?.links ?? [] },
  };
}

export function getLinks(): LinkCard[] {
  const raw = readYaml<Partial<LinkCard>[]>('links.yml');
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && item.label && item.href)
    .map((item) => ({
      label: String(item.label),
      kind: String(item.kind ?? ''),
      href: String(item.href),
      description: String(item.description ?? ''),
      span: clampSpan(item.span, 4),
      tone: toTone(item.tone),
      external: Boolean(item.external),
    }));
}

export function getProjects(): Project[] {
  const dir = path.join(CONTENT_DIR, 'projects');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      const data = parsed.data as Record<string, unknown>;
      if (data.draft === true) return null;

      const body = parsed.content.trim();
      const featured = data.featured === true;

      return {
        slug: file.replace(/\.md$/, ''),
        title: String(data.title ?? 'Untitled'),
        description: String(data.description ?? ''),
        stack: Array.isArray(data.stack) ? data.stack.map(String) : [],
        link: String(data.link ?? ''),
        featured,
        span: featured ? 8 : clampSpan(data.span, 4),
        order: Number(data.order ?? 100),
        body,
        hasCaseStudy: body.length > 0,
      } satisfies Project;
    })
    .filter((project): project is Project => project !== null)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((project) => project.slug === slug);
}

/* Long-form page copy lives in its own Markdown file so prose never ends
   up inside a YAML string. */
export function getMarkdownPage(name: string): string {
  const full = path.join(CONTENT_DIR, `${name}.md`);
  if (!fs.existsSync(full)) return '';
  return matter(fs.readFileSync(full, 'utf8')).content.trim();
}
