import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { tooManyRequests } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_ENV = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_TO'] as const;

function clientKey(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  if (tooManyRequests(clientKey(request))) {
    return fail('Too many messages from this address. Try again later.', 429);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return fail('Malformed request.', 400);
  }

  /* Bots fill hidden fields and submit faster than a person can type. */
  if (typeof payload.company === 'string' && payload.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }
  if (typeof payload.elapsed === 'number' && payload.elapsed < 2500) {
    return NextResponse.json({ ok: true });
  }

  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const subject = String(payload.subject ?? '').trim();
  const message = String(payload.message ?? '').trim();

  if (!name || !email || !subject || !message) {
    return fail('Please fill in every field.', 400);
  }
  if (name.length > 120 || email.length > 200 || subject.length > 160 || message.length > 5000) {
    return fail('That message is longer than this form accepts.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('That email address does not look right.', 400);
  }
  /* Header injection guard: a newline in a header field can forge headers. */
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email) || /[\r\n]/.test(subject)) {
    return fail('That message could not be accepted.', 400);
  }

  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`contact: missing environment variables: ${missing.join(', ')}`);
    return fail('The contact form is not configured yet.', 500);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
  });

  try {
    /* CONTACT_TO is read here and nowhere else. It is never returned to the
       client, never rendered, and never reaches the browser bundle. */
    await transporter.sendMail({
      to: process.env.CONTACT_TO as string,
      from: process.env.CONTACT_FROM || (process.env.SMTP_USER as string),
      replyTo: `${name} <${email}>`,
      subject: `[site] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
  } catch (err) {
    console.error('contact: send failed', err);
    return fail('The message could not be sent. Please try again later.', 502);
  }

  return NextResponse.json({ ok: true });
}
