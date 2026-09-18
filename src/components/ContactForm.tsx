'use client';

import { useRef, useState } from 'react';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const renderedAt = useRef(Date.now());

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setState('sending');
    setMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, elapsed: Date.now() - renderedAt.current }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !body.ok) {
        setState('error');
        setMessage(body.error ?? 'Something went wrong. Please try again.');
        return;
      }

      form.reset();
      setState('sent');
      setMessage('Message sent. Thank you.');
    } catch {
      setState('error');
      setMessage('Could not reach the server. Please try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <label className="field">
        <span>Name</span>
        <input type="text" name="name" required maxLength={120} autoComplete="name" />
      </label>

      <label className="field">
        <span>Your email, so I can reply</span>
        <input type="email" name="email" required maxLength={200} autoComplete="email" />
      </label>

      <label className="field">
        <span>Subject</span>
        <input type="text" name="subject" required maxLength={160} />
      </label>

      <label className="field">
        <span>Message</span>
        <textarea name="message" required maxLength={5000} />
      </label>

      <div className="trap" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button className="button" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending' : 'Send'}
      </button>

      <p className="form-status" data-state={state} role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
