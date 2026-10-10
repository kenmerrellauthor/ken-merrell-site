'use client';
import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { submitContact, submitReader, type FormState } from '@/app/actions';
import Turnstile, { Traps } from './Turnstile';
import { Arrow, Check, Warn } from './icons';

const initial: FormState = { ok: false, errors: {} };



function Submit({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? 'SENDING…' : children}
    </button>
  );
}

function Err({ id, text, dark }: { id: string; text?: string; dark?: boolean }) {
  if (!text) return null;
  return <span id={id} className={`err${dark ? ' dark' : ''}`} role="alert"><Warn />{text}</span>;
}

export function AdvanceForm({ bookTitle }: { bookTitle?: string }) {
  const [state, action] = useActionState(submitReader, initial);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    try {
      const sid = sessionStorage.getItem('km_session_id');
      if (sid) setSessionId(sid);
    } catch {}
  }, []);

  const v = state.values || {};
  if (state.ok) {
    return (
      <div className="ar-card" aria-live="polite">
        <div className="frame" />
        <div className="ar-ok">
          <div className="seal km-seal"><Check s={34} /></div>
          <h3>Check your email{state.name ? `, ${state.name}` : ''}.</h3>
          <p>
            We've sent a verification link to your email address. Please click the link to confirm your subscription and join the advance reader wishlist{bookTitle ? ` for "${bookTitle}"` : ''}.
          </p>
          <div className="next">
            <span><i>i.</i>Open the email we just sent you</span>
            <span><i>ii.</i>Click the confirm link inside</span>
            <span><i>iii.</i>Get your advance copy of {bookTitle || 'the book'} before launch</span>
          </div>
          <Link href="/books" style={{ fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#1b1814', borderBottom: '1px solid #1b1814', paddingBottom: 4, marginTop: 8 }}>BROWSE KEN’S BOOKS</Link>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="ar-card" noValidate>
      <div className="frame" />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="bookTitle" value={bookTitle || ''} />
      <div className="ttl">{bookTitle ? `Wishlist: ${bookTitle}` : 'Join the list'}</div>
      {bookTitle && (
        <div style={{ fontSize: 12, color: '#7a5f25', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: -6, marginBottom: 14 }}>
          Advance Reader Wishlist
        </div>
      )}
      {state.message && <div className="alert" role="alert"><Warn /><span>{state.message}</span></div>}
      <div className="field">
        <label htmlFor="ar-name">FULL NAME</label>
        <input id="ar-name" name="name" className="in-line" placeholder="Your name" autoComplete="name" defaultValue={v.name} aria-invalid={!!state.errors.name} aria-describedby={state.errors.name ? 'ar-name-err' : undefined} required />
        <Err id="ar-name-err" text={state.errors.name} />
      </div>
      <div className="field">
        <label htmlFor="ar-email">EMAIL</label>
        <input id="ar-email" name="email" type="email" className="in-line" placeholder="you@example.com" autoComplete="email" defaultValue={v.email} aria-invalid={!!state.errors.email} aria-describedby={state.errors.email ? 'ar-email-err' : undefined} required />
        <Err id="ar-email-err" text={state.errors.email} />
      </div>
      <fieldset className="field" style={{ border: 0, margin: 0, padding: '6px 0 0' }}>
        <legend style={{ padding: '0 0 10px' }}>PREFERRED FORMAT <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>(select one or both)</span></legend>
        <div className="fmt">
          <label><input type="checkbox" name="format" value="Ebook" defaultChecked={!v.format || v.format.includes('Ebook')} />Ebook</label>
          <label><input type="checkbox" name="format" value="Paperback" defaultChecked={v.format ? v.format.includes('Paperback') : false} />Paperback</label>
        </div>
        <Err id="ar-format-err" text={state.errors.format} />
      </fieldset>
      <label className="check" style={state.errors.agree ? { color: '#7d2a20' } : undefined}>
        <input type="checkbox" name="agree" defaultChecked={v.agree === 'on'} aria-invalid={!!state.errors.agree} />
        I’ll post an honest review within two weeks of launch.
      </label>
      <Traps />
      <Turnstile theme="light" />
      <Submit className="btn btn-dark" >JOIN THE ADVANCE READERS <Arrow /></Submit>
    </form>
  );
}

export function ContactForm() {
  const [state, action] = useActionState(submitContact, initial);
  const v = state.values || {};
  if (state.ok) {
    return (
      <div className="done" aria-live="polite">
        <span className="tick"><Check /></span>
        <h3>Message sent</h3>
        <p>Thank you{state.name ? `, ${state.name}` : ''}. Your note went straight to Ken{v.email ? <>, and he’ll reply to {v.email}</> : ''}.</p>
        <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>SEND ANOTHER MESSAGE</button>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      {state.message && <div className="alert" role="alert" style={{ background: 'rgba(198,91,74,.1)', color: '#e58a78', borderColor: 'rgba(198,91,74,.4)' }}><Warn /><span>{state.message}</span></div>}
      <div className="row2">
        <div className="field dark">
          <label htmlFor="c-name">NAME</label>
          <input id="c-name" name="name" className="in-dark" placeholder="Your name" autoComplete="name" defaultValue={v.name} aria-invalid={!!state.errors.name} aria-describedby={state.errors.name ? 'c-name-err' : undefined} />
          <Err id="c-name-err" text={state.errors.name} dark />
        </div>
        <div className="field dark">
          <label htmlFor="c-email">EMAIL</label>
          <input id="c-email" name="email" type="email" className="in-dark" placeholder="you@example.com" autoComplete="email" defaultValue={v.email} aria-invalid={!!state.errors.email} aria-describedby={state.errors.email ? 'c-email-err' : undefined} />
          <Err id="c-email-err" text={state.errors.email} dark />
        </div>
      </div>
      <div className="field dark">
        <label htmlFor="c-msg">MESSAGE</label>
        <textarea id="c-msg" name="message" className="ta-dark" placeholder="How can Ken help?" defaultValue={v.message} aria-invalid={!!state.errors.message} aria-describedby={state.errors.message ? 'c-msg-err' : undefined} />
        <Err id="c-msg-err" text={state.errors.message} dark />
      </div>
      <Traps />
      <Turnstile theme="dark" />
      <div className="foot" style={{ justifyContent: 'flex-end' }}>
        <Submit className="btn btn-gold">SEND MESSAGE <Arrow /></Submit>
      </div>
    </form>
  );
}

