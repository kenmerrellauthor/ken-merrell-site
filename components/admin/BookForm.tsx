'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Book, Quote } from '@/lib/types';
import { deleteBookAction, saveBookAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';

function Save({ label = 'SAVE CHANGES' }: { label?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="ad-btn pri" disabled={pending}><Ic k="check" s={16} sw={1.8} />{pending ? 'SAVING…' : label}</button>;
}

function Field({ label, name, value, placeholder, help, area, rows, type = 'text' }: { label: string; name: string; value?: string; placeholder?: string; help?: string; area?: boolean; rows?: number; type?: string }) {
  const id = `f-${name}`;
  return (
    <div className="ad-field">
      <label className="ad-label" htmlFor={id}>{label}</label>
      {area ? (
        <textarea id={id} name={name} className="ad-in" defaultValue={value} placeholder={placeholder} rows={rows ?? 6} />
      ) : (
        <input id={id} name={name} type={type} className="ad-in" defaultValue={value} placeholder={placeholder} />
      )}
      {help && <span className="help">{help}</span>}
    </div>
  );
}

function ImagePick({ name, current, label, aspect, removeName }: { name: string; current: string | null; label: string; aspect: string; removeName: string }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {preview && !removed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', boxShadow: '10px 8px 24px rgba(0,0,0,.6)' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: aspect, border: '1px dashed #4a4137', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6457', fontSize: 13, textAlign: 'center', padding: 12 }}>No image yet</div>
      )}
      <label className="drop" style={{ position: 'relative', justifyContent: 'center' }}>
        <Ic k="up" s={16} />{label}
        <input type="file" name={name} accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPreview(URL.createObjectURL(f)); setRemoved(false); } }} />
      </label>
      {current && (
        <label className="chk" style={{ fontSize: 13 }}><input type="checkbox" name={removeName} checked={removed} onChange={(e) => setRemoved(e.target.checked)} />Remove this image</label>
      )}
    </div>
  );
}

export default function BookForm({ book, isNew }: { book: Book; isNew: boolean }) {
  const router = useRouter();
  const [state, action] = useActionState<AdminState, FormData>(saveBookAction, {});
  const [status, setStatus] = useState(book.status);
  const [audible, setAudible] = useState(!!book.audibleUrl);
  const [quotes, setQuotes] = useState<Quote[]>(book.quotes.length ? book.quotes : []);
  const [fileName, setFileName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state.ok && isNew && state.id) router.replace(`/admin/books/${state.id}?saved=1`);
    if (state.ok) setDirty(false);
  }, [state, isNew, router]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const words = book.sample.trim() ? book.sample.trim().split(/\s+/).length : 0;

  return (
    <form action={action} onChange={() => setDirty(true)}>
      <input type="hidden" name="id" value={book.id} />
      <input type="hidden" name="quotes" value={JSON.stringify(quotes)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <nav className="crumb" aria-label="Breadcrumb"><Link href="/admin">Books</Link><span>/</span><span style={{ color: 'var(--soft)' }}>{isNew ? 'Add a book' : 'Edit book'}</span></nav>
        <div className="ad-top">
          <div>
            <h1>{isNew ? 'Add a book' : book.title}</h1>
            <p>{isNew ? 'Fill in what you have. You can come back and add the rest later.' : 'Changes go live on the book page as soon as you press Save.'}</p>
          </div>
          <div className="ad-actions">
            {!isNew && <a href={`/books/${book.slug}`} target="_blank" className="ad-btn"><Ic k="ext" s={16} />VIEW PAGE</a>}
            <Save label={isNew ? 'ADD BOOK' : 'SAVE CHANGES'} />
          </div>
        </div>
        {state.error && <div className="ad-err" role="alert">{state.error}</div>}
        {state.ok && !isNew && <div className="ad-ok" role="status"><Ic k="check" s={16} sw={2} />Saved. The site is updated.</div>}

        <div className="ad-editor">
          <div className="col">
            <section className="ad-card">
              <h2>The basics</h2>
              <Field label="TITLE" name="title" value={book.title} placeholder="Petticoats and Ash" />
              <div className="ad-grid2">
                <Field label="GENRE LINE" name="genre" value={book.genre} placeholder="Historical suspense · A novel" />
                <Field label="WEB ADDRESS" name="slug" value={book.slug} placeholder="made from the title" help={`yoursite.com/books/${book.slug || '…'}`} />
              </div>
              <Field label="TAGLINE" name="tagline" value={book.tagline} area rows={2} placeholder="They hanged her husband. They did not silence his widow." help="One or two short lines. A new line here starts a new line on the site." />
              <Field label="DESCRIPTION" name="description" value={book.description} area rows={7} placeholder="A paragraph or two that sets up the story." />
              <Field label="BANNER TITLE" name="displayTitle" value={book.displayTitle} placeholder="Petticoats *and a*|Traitor’s Death" help="How the title looks in big banners. Put small words in *stars* to make them gold italics, and use | to start a new line." />
            </section>

            <section className="ad-card">
              <h2>Sample chapter</h2>
              <p className="sub">Paste the text, or upload a Word (.docx) or text file. It is laid out as book pages automatically. Leave a blank line between paragraphs, and put *** on its own line for a scene break.</p>
              <label className="drop" style={{ position: 'relative' }}>
                <span style={{ display: 'flex', color: 'var(--gold)' }}><Ic k="file" s={24} sw={1.4} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ color: 'var(--cream)' }}>{fileName || 'Upload the chapter file'}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{fileName ? 'It will replace the text below when you save.' : words ? `Current sample: about ${words.toLocaleString()} words` : 'Word (.docx) or .txt'}</span>
                </span>
                <input type="file" name="sampleFile" accept=".docx,.txt,.md" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
              </label>
              <Field label="CHAPTER TITLE" name="chapterTitle" value={book.chapterTitle} placeholder="Optional, e.g. The Gallows Road" />
              <Field label="OR PASTE THE TEXT" name="sample" value={book.sample} area rows={14} placeholder="Chapter One…" />
            </section>

            <section className="ad-card">
              <h2>Where to buy</h2>
              <Field label="AMAZON LINK" name="amazonUrl" value={book.amazonUrl} placeholder="https://www.amazon.com/dp/…" type="url" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(239,231,214,.06)' }}>
                <span><span style={{ display: 'block', fontSize: 16 }}>This book has an audiobook</span><span style={{ fontSize: 13, color: 'var(--muted)' }}>Shows the Listen on Audible button on the book page.</span></span>
                <button type="button" role="switch" className="switch" aria-checked={audible} aria-label="Has an audiobook" onClick={() => { setAudible(!audible); setDirty(true); }}><span /></button>
                <input type="hidden" name="hasAudible" value={audible ? 'on' : ''} />
              </div>
              {audible && <Field label="AUDIBLE LINK" name="audibleUrl" value={book.audibleUrl} placeholder="https://www.audible.com/pd/…" type="url" />}
            </section>

            <section className="ad-card">
              <h2>Details &amp; praise</h2>
              <div className="ad-grid2">
                <Field label="PUBLISHED" name="published" value={book.published} placeholder="March 2025" />
                <Field label="PAGES" name="pages" value={book.pages} placeholder="352" />
                <Field label="FORMATS" name="formats" value={book.formats} placeholder="Print, Ebook, Audio" />
                <Field label="ISBN" name="isbn" value={book.isbn} placeholder="978-0-000-00000-0" />
              </div>
              <div className="ad-field">
                <span className="ad-label">READER AND REVIEWER QUOTES</span>
                {quotes.map((q, k) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px 40px', gap: 12 }}>
                    <input aria-label={`Quote ${k + 1}`} className="ad-in" placeholder="Quote" value={q.text} onChange={(e) => setQuotes(quotes.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)))} />
                    <input aria-label={`Quote ${k + 1} source`} className="ad-in" placeholder="Name · Source" value={q.source} onChange={(e) => setQuotes(quotes.map((x, j) => (j === k ? { ...x, source: e.target.value } : x)))} />
                    <button type="button" className="ad-sm icon" aria-label="Remove quote" onClick={() => { setQuotes(quotes.filter((_, j) => j !== k)); setDirty(true); }} style={{ height: 48 }}><Ic k="trash" s={16} /></button>
                  </div>
                ))}
                {quotes.length < 3 && (
                  <button type="button" className="drop" style={{ alignSelf: 'flex-start', background: 'none' }} onClick={() => setQuotes([...quotes, { text: '', source: '' }])}><Ic k="plus" s={15} />Add a quote</button>
                )}
                <span className="help">Up to three quotes show under the book on its page.</span>
              </div>
            </section>
          </div>

          <div className="col side">
            <section className="ad-card">
              <h2>Status</h2>
              <label className="choice"><input type="radio" name="status" value="available" checked={status === 'available'} onChange={() => setStatus('available')} /><span><b>Available</b><small>On the shelf with buy links</small></span></label>
              <label className="choice"><input type="radio" name="status" value="coming" checked={status === 'coming'} onChange={() => setStatus('coming')} /><span><b>Coming soon</b><small>Teaser, countdown and reader signup</small></span></label>
              {status === 'coming' && (
                <div className="ad-grid2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <Field label="RELEASE DATE" name="releaseDate" value={book.releaseDate} type="date" help="Drives the countdown" />
                  <Field label="SHOWN AS" name="releaseLabel" value={book.releaseLabel} placeholder="Spring 2027" />
                </div>
              )}
              {status === 'available' && (
                <>
                  <label className="chk"><input type="checkbox" name="featured" defaultChecked={book.featured} />Feature in the homepage banner</label>
                  <label className="chk"><input type="checkbox" name="isNew" defaultChecked={book.isNew} />Show the NEW ribbon</label>
                </>
              )}
              {status === 'coming' && (<><input type="hidden" name="featured" value={book.featured ? 'on' : ''} /><input type="hidden" name="isNew" value={book.isNew ? 'on' : ''} /></>)}
            </section>
            <section className="ad-card">
              <h2>Cover</h2>
              <div style={{ width: 200, alignSelf: 'center' }}>
                <ImagePick name="cover" current={book.cover} label="Upload a cover" aspect="2 / 3" removeName="removeCover" />
              </div>
              <span className="help" style={{ fontSize: 13, color: '#6e6457', lineHeight: 1.5 }}>JPG or PNG, at least 1600 px tall. Without a cover the book shows as a cloth hardback in this color:</span>
              <input type="color" name="clothColor" defaultValue={book.clothColor} aria-label="Cloth cover color" style={{ width: 64, height: 36, border: '1px solid #3a332b', background: 'none' }} />
            </section>
            <section className="ad-card">
              <h2>Banner image</h2>
              <p className="sub">Optional. Used behind the book on its page and in the homepage banner. Wide images work best (1600 × 900).</p>
              <ImagePick name="banner" current={book.banner} label="Upload a banner" aspect="16 / 9" removeName="removeBanner" />
            </section>
            {!isNew && (
              confirmDel ? (
                <div className="ad-card" style={{ borderColor: 'rgba(198,91,74,.45)' }}>
                  <p style={{ margin: 0 }}>Remove <b>{book.title}</b> from the site? This cannot be undone.</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" formAction={deleteBookAction} formNoValidate className="ad-btn" style={{ borderColor: '#c65b4a', color: '#e58a78' }}>YES, REMOVE</button>
                    <button type="button" className="ad-btn" onClick={() => setConfirmDel(false)}>KEEP IT</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="ad-sm danger" style={{ border: 0, justifyContent: 'center' }} onClick={() => setConfirmDel(true)}><Ic k="trash" s={16} />Remove this book</button>
              )
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
