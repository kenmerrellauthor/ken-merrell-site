'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, type AdminState } from '../actions';
import { Ic } from '@/components/admin/AdIcons';
import Turnstile from '@/components/Turnstile';

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-gold" style={{ height: 54, padding: 0, fontSize: 12, boxShadow: 'none' }} disabled={pending}>
      {pending ? 'SIGNING IN…' : 'SIGN IN'} <Ic k="check" s={16} />
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState<AdminState, FormData>(login, {});
  return (
    <form action={action}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 44, width: 'auto' }} />
        <div className="rule2" style={{ width: '100%' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 700, letterSpacing: '.3em', color: 'var(--gold)' }}><Ic k="lock" s={14} sw={1.8} />PRIVATE SITE ADMIN</span>
      </div>
      {state.error && <div className="ad-err" role="alert">{state.error}</div>}
      <div className="ad-field">
        <label className="ad-label" htmlFor="lg-email">EMAIL</label>
        <input id="lg-email" name="email" type="email" className="ad-in" autoComplete="username" defaultValue={state.fields?.email} required />
      </div>
      <div className="ad-field">
        <label className="ad-label" htmlFor="lg-pw">PASSWORD</label>
        <input id="lg-pw" name="password" type="password" className="ad-in" autoComplete="current-password" required />
      </div>
      <Turnstile theme="dark" />
      <Btn />
      <p style={{ margin: 0, textAlign: 'center', fontSize: 13, lineHeight: 1.5, color: '#6e6457' }}>Only Ken can sign in here. Visitors never see this page.</p>
    </form>
  );
}
