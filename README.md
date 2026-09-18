# personal-site

Next.js site, built and run entirely on a Raspberry Pi, served through an
existing Cloudflare Tunnel. No cross-compilation and no separate build machine.

## What you edit

All of it lives in `content/`. Nothing in there can break the layout.

| File | Controls |
| --- | --- |
| `content/site.yml` | your name, the tagline, page titles and intros, footer links |
| `content/links.yml` | the cards on the homepage: label, span, tone, destination |
| `content/about.md` | the whole about page, in Markdown |
| `content/resume.md` | the whole resume page, in Markdown |
| `content/projects/*.md` | one file per portfolio entry |

### Adding a project

Copy `content/projects/_example.md` to a new filename and edit it. The
filename becomes the URL, so `staffing-forecast.md` serves at
`/portfolio/staffing-forecast`.

```yaml
---
title: Project title
description: One or two sentences. This is what shows on the card.
stack: [python, postgres]
link: https://github.com/you/repo
featured: false   # true renders a wide olive card
span: 4           # 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 1          # lower numbers sort first
draft: true       # delete this line to publish
---

Everything under the dashes is the optional case study, in Markdown.
```

A project with a case study links to its own page. A project with no case
study but a `link` links straight out. `_example.md` stays hidden while
`draft: true` is set, so the portfolio shows its empty state until you
publish something.

Content is bind-mounted into the container, so after editing:

```bash
docker compose restart app
```

No rebuild. Rebuild only when you change code under `src/`.

### The resume

`content/resume.md` is plain Markdown, rendered at `/resume`. One convention:
the line directly under a role heading is styled as the organisation-and-dates
meta line.

```markdown
### Job title
Organisation, city, dates

- What you did, and what changed because of it.
```

The page has print styles, so anyone who wants a PDF can use the browser's
own print dialogue. There is no PDF file to keep in sync.

## Design

The palette, type and card rules all live at the top of
`src/app/globals.css` as custom properties. Card tones are `chalk`,
`forest`, `camel`, `sage` and `olive`; spans are 3 to 12 on a twelve-column
grid, and uneven spans are deliberate.

## First run on the Pi

```bash
cp .env.example .env
```

Fill in `.env`. It is gitignored, referenced by `docker-compose.yml` at
runtime, and never copied into the image.

| Variable | What it is |
| --- | --- |
| `TUNNEL_TOKEN` | Cloudflare Zero Trust tunnel token |
| `CONTACT_TO` | where form messages are delivered, server-side only |
| `CONTACT_FROM` | envelope sender, usually the same as `SMTP_USER` |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` | your mail provider |

Then:

```bash
docker compose up -d --build
```

In the Cloudflare Zero Trust dashboard, point the tunnel's public hostname
at `http://app:3000`. The two containers share the compose network, so the
app never needs a published port on the Pi and `expose` is enough.

Both services are set to `restart: unless-stopped`.

The Docker build needs network access: `next/font` downloads Newsreader and
DM Mono at build time and self-hosts them in the output, so the finished
site makes no third-party font requests.

## Local development

```bash
npm install
npm run dev
```

## On the contact form

No email address appears anywhere in this repo, in any rendered page, or in
any client bundle. The form POSTs JSON to `/api/contact`, which runs
server-side only, reads `CONTACT_TO` from the environment, and sends through
your SMTP provider. The visitor's own address is used as `Reply-To`.

The route has no captcha. Instead it uses a hidden honeypot field, a
minimum time-to-submit, per-IP rate limiting (eight per hour, read from
`cf-connecting-ip`), length caps, and a CRLF check on header fields to
prevent header injection.
