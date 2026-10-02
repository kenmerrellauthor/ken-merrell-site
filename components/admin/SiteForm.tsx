'use client';
import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { HomeQuote, SiteSettings } from '@/lib/types';
import { saveSiteAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';
import { ImagePick } from './ImagePick';

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="ad-btn pri" disabled={pending}><Ic k="check" s={16} sw={1.8} />{pending ? 'SAVING…' : 'SAVE CHANGES'}</button>;
}

function EditableField({
  label,
  name,
  defaultValue = '',
  placeholder,
  type = 'text',
  help,
  icon,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  help?: string;
  icon?: string;
}) {
  const [val, setVal] = useState(defaultValue);
  const [draft, setDraft] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(val);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    const next = draft.trim();
    setVal(next);
    if (hiddenRef.current) {
      hiddenRef.current.value = next;
    }
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    setTimeout(() => {
      hiddenRef.current?.form?.requestSubmit();
    }, 60);
  };

  const handleCancel = () => {
    setDraft(val);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="ad-field">
      {/* Hidden input ensures main form submission always captures the value */}
      <input ref={hiddenRef} type="hidden" name={name} value={val} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="ad-label" htmlFor={`f-${name}`}>{label}</label>
        {justSaved && (
          <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.1em', color: '#6dbf78', fontWeight: 600 }}>
            ✓ SAVED
          </span>
        )}
      </div>

      {!editing ? (
        /* Saved view: textfield has disappeared, shows display box with Edit button */
        <div
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#120f0d',
            border: '1px solid #3a332b',
            borderRadius: 3,
            padding: '8px 14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {icon && (
              <span style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Ic k={icon} s={16} />
              </span>
            )}
            {val ? (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 16, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {val}
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
                Not configured (click Edit to add)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="ad-sm"
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              background: 'rgba(201,168,96,.12)',
              borderColor: 'rgba(201,168,96,.35)',
              color: 'var(--gold)',
              cursor: 'pointer'
            }}
          >
            <Ic k="edit" s={13} />
            Edit
          </button>
        </div>
      ) : (
        /* Editing view: textfield appears with Save and Cancel buttons */
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              id={`f-${name}`}
              type={type}
              className="ad-in"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ width: '100%' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="ad-btn pri"
            style={{ height: 48, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Ic k="check" s={14} />
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="ad-btn sec"
            style={{ height: 48, padding: '0 14px', fontSize: 13, flexShrink: 0 }}
          >
            Cancel
          </button>
        </div>
      )}

      {help && <span className="help">{help}</span>}
    </div>
  );
}

export default function SiteForm({ site }: { site: SiteSettings }) {
  const [state, action] = useActionState<AdminState, FormData>(saveSiteAction, {});
  const [quotes, setQuotes] = useState<HomeQuote[]>(site.homeQuotes);
  const set = (k: number, key: keyof HomeQuote, v: string) => setQuotes(quotes.map((q, j) => (j === k ? { ...q, [key]: v } : q)));
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <input type="hidden" name="homeQuotes" value={JSON.stringify(quotes)} />
      <div className="ad-top">
        <div><h1>Author &amp; bio</h1><p>What visitors see in the About section, the homepage quotes, and where messages are sent.</p></div>
        <div className="ad-actions"><Save /></div>
      </div>
      {state.error && <div className="ad-err" role="alert">{state.error}</div>}
      {state.ok && <div className="ad-ok" role="status"><Ic k="check" s={16} sw={2} />Saved. The site is updated.</div>}
      <div className="ad-editor" style={{ gridTemplateColumns: '340px minmax(0,1fr)' }}>
        <section className="ad-card">
          <h2>Author photo</h2>
          <ImagePick 
            name="photo" 
            current={site.photo} 
            label="Upload a photo" 
            aspect="44 / 58" 
            removeName="removePhoto" 
            sizeHint="Recommended: 880 × 1160"
          />
        </section>
        <div className="col">
          <section className="ad-card">
            <h2>About Ken</h2>
            <div className="ad-field"><label className="ad-label" htmlFor="pq">PULL QUOTE</label><input id="pq" name="pullQuote" className="ad-in" defaultValue={site.pullQuote} /></div>
            <div className="ad-field"><label className="ad-label" htmlFor="bio">BIO</label><textarea id="bio" name="bio" className="ad-in" rows={10} defaultValue={site.bio} /><span className="help">Leave a blank line to start a new paragraph.</span></div>
          </section>
          <section className="ad-card">
            <h2>Homepage quotes</h2>
            <p className="sub">The quotes that swipe under the homepage banner. Three or four work best.</p>
            {quotes.map((q, k) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 18, borderBottom: '1px solid rgba(239,231,214,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="ad-label">QUOTE {k + 1}</span><button type="button" className="ad-sm icon" aria-label={`Remove quote ${k + 1}`} onClick={() => setQuotes(quotes.filter((_, j) => j !== k))}><Ic k="trash" s={16} /></button></div>
                <input className="ad-in" aria-label="Quote" value={q.text} onChange={(e) => set(k, 'text', e.target.value)} placeholder="The quote" />
                <div className="ad-grid2">
                  <input className="ad-in" aria-label="Line under the quote" value={q.sub} onChange={(e) => set(k, 'sub', e.target.value)} placeholder="Line under it (or the book title)" />
                  <input className="ad-in" aria-label="Who said it" value={q.who} onChange={(e) => set(k, 'who', e.target.value)} placeholder="Who said it" />
                </div>
              </div>
            ))}
            {quotes.length < 6 && <button type="button" className="drop" style={{ alignSelf: 'flex-start', background: 'none' }} onClick={() => setQuotes([...quotes, { text: '', sub: '', who: '' }])}><Ic k="plus" s={15} />Add a quote</button>}
          </section>
          <section className="ad-card">
            <h2>Links &amp; email</h2>
            <div className="ad-grid2">
              <EditableField
                label="AMAZON AUTHOR PAGE"
                name="amazonAuthorUrl"
                type="url"
                defaultValue={site.amazonAuthorUrl}
                placeholder="https://www.amazon.com/stores/…"
                icon="link"
              />
              <EditableField
                label="YOUTUBE CHANNEL"
                name="youtubeUrl"
                type="url"
                defaultValue={site.youtubeUrl}
                placeholder="https://www.youtube.com/@…"
                icon="video"
              />
            </div>
            <EditableField
              label="WHERE MESSAGES AND SIGNUPS ARE SENT"
              name="notifyEmail"
              type="email"
              defaultValue={site.notifyEmail || 'upcometrends@gmail.com'}
              placeholder="upcometrends@gmail.com"
              icon="mail"
              help="Never shown on the site. Contact form messages and advance reader signups are emailed here."
            />
          </section>
        </div>
      </div>
    </form>
  );
}
