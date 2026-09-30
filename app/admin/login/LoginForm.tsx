'use client';
import { useState } from 'react';
import { login } from '../actions';
import { Ic } from '@/components/admin/AdIcons';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('email', trimmedEmail);
      formData.set('password', password);

      // Primary: Server Action
      const res = await login({}, formData);
      if (res?.error) {
        setError(res.error);
        setPending(false);
        return;
      }

      // Success -> navigate to /admin
      window.location.href = '/admin';
    } catch (actionErr: any) {
      // In case Server Action fails over network or proxy, try direct API route fallback
      try {
        const apiRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password })
        });
        const json = await apiRes.json();
        if (json.ok) {
          window.location.href = '/admin';
          return;
        }
        setError(json.error || 'That email and password do not match.');
      } catch {
        setError(actionErr?.message || 'Unable to connect. Please try again.');
      }
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} method="POST" action="/api/admin/login" noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 44, width: 'auto' }} />
        <div className="rule2" style={{ width: '100%' }} />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--serif-c)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.3em',
            color: 'var(--gold)'
          }}
        >
          <Ic k="lock" s={14} sw={1.8} />PRIVATE SITE ADMIN
        </span>
      </div>

      {error && (
        <div className="ad-err" role="alert">
          {error}
        </div>
      )}

      <div className="ad-field">
        <label className="ad-label" htmlFor="lg-email">
          EMAIL
        </label>
        <input
          id="lg-email"
          name="email"
          type="email"
          className="ad-in"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ken@example.com"
          required
        />
      </div>

      <div className="ad-field">
        <label className="ad-label" htmlFor="lg-pw">
          PASSWORD
        </label>
        <input
          id="lg-pw"
          name="password"
          type="password"
          className="ad-in"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        className="ad-btn pri"
        style={{
          height: 52,
          width: '100%',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.24em'
        }}
        disabled={pending}
      >
        {pending ? 'SIGNING IN…' : 'SIGN IN'} <Ic k="check" s={16} />
      </button>

      <p style={{ margin: 0, textAlign: 'center', fontSize: 13, lineHeight: 1.5, color: '#6e6457' }}>
        Only Ken can sign in here. Visitors never see this page.
      </p>
    </form>
  );
}
