'use client';
import { useActionState, useRef, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import type { HomeQuote, SiteSettings, SocialLink } from '@/lib/types';
import { saveSiteAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';
import { ImagePick } from './ImagePick';

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="crm-btn pri" disabled={pending}><Ic k="check" s={16} sw={1.8} />{pending ? 'SAVING…' : 'SAVE CHANGES'}</button>;
}

function EditableField({
  label,
  name,
  defaultValue = '',
  placeholder,
  type = 'text',
  help,
  icon,
  multiline,
  rows = 10,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  help?: string;
  icon?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [val, setVal] = useState(defaultValue);
  const [draft, setDraft] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<any>(null);
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
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="crm-field">
      {/* Hidden input ensures main form submission always captures the value */}
      <input ref={hiddenRef} type="hidden" name={name} value={val} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="crm-label" htmlFor={`f-${name}`}>{label}</label>
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
            className="crm-sm"
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
        <div style={{ display: 'flex', gap: 8, alignItems: multiline ? 'flex-start' : 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            {multiline ? (
              <textarea
                ref={inputRef}
                id={`f-${name}`}
                className="crm-in"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{ width: '100%', resize: 'vertical' }}
                rows={rows}
              />
            ) : (
              <input
                ref={inputRef}
                id={`f-${name}`}
                type={type}
                className="crm-in"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{ width: '100%' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexDirection: multiline ? 'column' : 'row' }}>
            <button
              type="button"
              onClick={handleSave}
              className="crm-btn pri"
              style={{ height: 48, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <Ic k="check" s={14} />
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="crm-btn sec"
              style={{ height: 48, padding: '0 14px', fontSize: 13, flexShrink: 0 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {help && <span className="help">{help}</span>}
    </div>
  );
}

function EditableQuote({
  quote,
  idx,
  onUpdate,
  onRemove
}: {
  quote: HomeQuote;
  idx: number;
  onUpdate: (q: HomeQuote) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(quote);
  const [editing, setEditing] = useState(!quote.text);
  const [justSaved, setJustSaved] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(quote);
    setEditing(true);
  };

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    setTimeout(() => {
      hiddenRef.current?.form?.requestSubmit();
    }, 60);
  };

  const handleCancel = () => {
    if (!quote.text) {
      onRemove();
    } else {
      setDraft(quote);
      setEditing(false);
    }
  };

  return (
    <div className="crm-field" style={{ paddingBottom: 18, borderBottom: '1px solid rgba(239,231,214,.06)' }}>
      <input ref={hiddenRef} type="hidden" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="crm-label">QUOTE {idx + 1}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {justSaved && (
            <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.1em', color: '#6dbf78', fontWeight: 600 }}>
              ✓ SAVED
            </span>
          )}
          {!editing && (
            <button type="button" className="crm-sm icon" aria-label={`Remove quote ${idx + 1}`} onClick={onRemove}>
              <Ic k="trash" s={16} />
            </button>
          )}
        </div>
      </div>

      {!editing ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            {quote.text ? (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 16, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                "{quote.text}"
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
                Empty quote
              </span>
            )}
            {(quote.sub || quote.who) && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {quote.who ? `— ${quote.who}` : ''} {quote.sub ? `(${quote.sub})` : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="crm-sm"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', fontSize: 12, background: 'rgba(201,168,96,.12)',
              borderColor: 'rgba(201,168,96,.35)', color: 'var(--gold)', cursor: 'pointer'
            }}
          >
            <Ic k="edit" s={13} />
            Edit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <input className="crm-in" aria-label="Quote" maxLength={60} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="The quote" />
            <div style={{ fontSize: 11, color: draft.text.length >= 60 ? '#d32f2f' : 'var(--muted)', textAlign: 'right', marginTop: 4 }}>
              {draft.text.length}/60
            </div>
          </div>
          <div className="crm-grid2">
            <input className="crm-in" aria-label="Line under the quote" value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} placeholder="Line under it (or the book title)" />
            <input className="crm-in" aria-label="Who said it" value={draft.who} onChange={(e) => setDraft({ ...draft, who: e.target.value })} placeholder="Who said it" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button type="button" onClick={handleSave} className="crm-btn pri" style={{ height: 48, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Ic k="check" s={14} />
              Save
            </button>
            <button type="button" onClick={handleCancel} className="crm-btn sec" style={{ height: 48, padding: '0 14px', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableSocialLink({
  link,
  idx,
  onUpdate,
  onRemove
}: {
  link: import('@/lib/types').SocialLink;
  idx: number;
  onUpdate: (s: import('@/lib/types').SocialLink) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(link);
  const [editing, setEditing] = useState(!link.platform || !link.url);
  const [justSaved, setJustSaved] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(link);
    setEditing(true);
  };

  const handleSave = () => {
    onUpdate(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    setTimeout(() => {
      hiddenRef.current?.form?.requestSubmit();
      setTimeout(() => setEditing(false), 200);
    }, 60);
  };

  const handleCancel = () => {
    if (!link.platform || !link.url) {
      onRemove();
    } else {
      setDraft(link);
      setEditing(false);
    }
  };

  return (
    <div className="crm-field" style={{ paddingBottom: 18, borderBottom: '1px solid rgba(239,231,214,.06)' }}>
      <input ref={hiddenRef} type="hidden" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="crm-label">SOCIAL LINK {idx + 1}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {justSaved && (
            <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.1em', color: '#6dbf78', fontWeight: 600 }}>
              ✓ SAVED
            </span>
          )}
          {!editing && (
            <button type="button" className="crm-sm icon" aria-label={`Remove link ${idx + 1}`} onClick={onRemove}>
              <Ic k="trash" s={16} />
            </button>
          )}
        </div>
      </div>

      {!editing ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            {link.platform ? (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 16, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {link.platform}
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--serif-b)', fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
                Empty link
              </span>
            )}
            {link.url && (
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {link.url}
              </span>
            )}
            {link.image && (
              <span style={{ fontSize: 12, color: 'var(--gold)' }}>
                ✓ Custom image
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="crm-sm"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', fontSize: 12, background: 'rgba(201,168,96,.12)',
              borderColor: 'rgba(201,168,96,.35)', color: 'var(--gold)', cursor: 'pointer'
            }}
          >
            <Ic k="edit" s={13} />
            Edit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="crm-grid2">
            <input className="crm-in" aria-label="Platform name" value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} placeholder="Platform (e.g. Instagram)" />
            <input className="crm-in" aria-label="URL" type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." />
          </div>
          <ImagePick
            name={`socialImage_${idx}`}
            current={draft.image || null}
            label="Upload background image (optional)"
            aspect="300 / 400"
            removeName={`removeSocialImage_${idx}`}
            sizeHint="Recommended: 600 × 800"
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button type="button" onClick={handleSave} className="crm-btn pri" style={{ height: 48, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Ic k="check" s={14} />
              Save
            </button>
            <button type="button" onClick={handleCancel} className="crm-btn sec" style={{ height: 48, padding: '0 14px', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteForm({ site }: { site: SiteSettings }) {
  const [state, action] = useActionState<AdminState, FormData>(saveSiteAction, {});
  const [quotes, setQuotes] = useState<HomeQuote[]>(site.homeQuotes);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(site.socialLinks || []);

  useEffect(() => {
    if (state.site) {
      if (state.site.homeQuotes) setQuotes(state.site.homeQuotes);
      if (state.site.socialLinks) setSocialLinks(state.site.socialLinks);
    }
  }, [state.site]);

  const set = (k: number, key: keyof HomeQuote, v: string) => setQuotes(quotes.map((q, j) => (j === k ? { ...q, [key]: v } : q)));
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <input type="hidden" name="homeQuotes" value={JSON.stringify(quotes)} />
      <input type="hidden" name="socialLinks" value={JSON.stringify(socialLinks)} />
      <div className="crm-top">
        <div><h1>Author &amp; bio</h1><p>What visitors see in the About section, the homepage quotes, and where messages are sent.</p></div>
        <div className="crm-actions"><Save /></div>
      </div>
      {state.error && <div className="crm-err" role="alert">{state.error}</div>}
      {state.ok && <div className="crm-ok" role="status"><Ic k="check" s={16} sw={2} />Saved. The site is updated.</div>}
      <div className="crm-editor" style={{ gridTemplateColumns: '340px minmax(0,1fr)' }}>
        <section className="crm-card">
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
          <section className="crm-card">
            <h2>About Ken</h2>
            <EditableField
              label="PULL QUOTE"
              name="pullQuote"
              defaultValue={site.pullQuote}
              icon="quote"
            />
            <EditableField
              label="BIO"
              name="bio"
              defaultValue={site.bio}
              multiline={true}
              rows={10}
              help="Leave a blank line to start a new paragraph."
              icon="text"
            />
          </section>
          <section className="crm-card">
            <h2>Homepage quotes</h2>
            <p className="sub">The quotes that swipe under the homepage banner. Three or four work best.</p>
            {quotes.map((q, k) => (
              <EditableQuote
                key={k}
                idx={k}
                quote={q}
                onUpdate={(newQ) => {
                  setQuotes(quotes.map((oldQ, j) => j === k ? newQ : oldQ));
                }}
                onRemove={() => setQuotes(quotes.filter((_, j) => j !== k))}
              />
            ))}
            {quotes.length < 6 && <button type="button" className="drop" style={{ alignSelf: 'flex-start', background: 'none' }} onClick={() => setQuotes([...quotes, { text: '', sub: '', who: '' }])}><Ic k="plus" s={15} />Add a quote</button>}
          </section>
          <section className="crm-card">
            <h2>Email Settings</h2>
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
          <section className="crm-card">
            <h2>Social Media Links</h2>
            <p className="sub">Custom social media links displayed on the site.</p>
            {socialLinks.map((s, k) => (
              <EditableSocialLink
                key={k}
                idx={k}
                link={s}
                onUpdate={(newS) => {
                  setSocialLinks(socialLinks.map((oldS, j) => j === k ? newS : oldS));
                }}
                onRemove={() => setSocialLinks(socialLinks.filter((_, j) => j !== k))}
              />
            ))}
            <button type="button" className="drop" style={{ alignSelf: 'flex-start', background: 'none' }} onClick={() => setSocialLinks([...socialLinks, { platform: '', url: '' }])}><Ic k="plus" s={15} />Add a link</button>
          </section>
        </div>
      </div>
    </form>
  );
}
