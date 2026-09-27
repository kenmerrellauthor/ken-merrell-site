'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { HomeQuote, SiteSettings } from '@/lib/types';
import { saveSiteAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="ad-btn pri" disabled={pending}><Ic k="check" s={16} sw={1.8} />{pending ? 'SAVING…' : 'SAVE CHANGES'}</button>;
}

export default function SiteForm({ site }: { site: SiteSettings }) {
  const [state, action] = useActionState<AdminState, FormData>(saveSiteAction, {});
  const [quotes, setQuotes] = useState<HomeQuote[]>(site.homeQuotes);
  const [preview, setPreview] = useState<string | null>(site.photo);
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
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ width: '100%', aspectRatio: '44 / 58', objectFit: 'cover' }} />
          ) : (
            <div style={{ aspectRatio: '44 / 58', background: '#1f1a15', border: '1px dashed #4a4137', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6457', fontFamily: 'var(--serif-c)', fontSize: 11, letterSpacing: '.24em' }}>[AUTHOR PHOTO]</div>
          )}
          <label className="drop" style={{ position: 'relative', justifyContent: 'center' }}>
            <Ic k="up" s={16} />Upload a photo
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
          </label>
          {site.photo && <label className="chk" style={{ fontSize: 13 }}><input type="checkbox" name="removePhoto" />Remove the current photo</label>}
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
              <div className="ad-field"><label className="ad-label" htmlFor="amz">AMAZON AUTHOR PAGE</label><input id="amz" name="amazonAuthorUrl" type="url" className="ad-in" defaultValue={site.amazonAuthorUrl} placeholder="https://www.amazon.com/stores/…" /></div>
              <div className="ad-field"><label className="ad-label" htmlFor="yt">YOUTUBE CHANNEL</label><input id="yt" name="youtubeUrl" type="url" className="ad-in" defaultValue={site.youtubeUrl} placeholder="https://www.youtube.com/@…" /></div>
            </div>
            <div className="ad-field"><label className="ad-label" htmlFor="ne">WHERE MESSAGES AND SIGNUPS ARE SENT</label><input id="ne" name="notifyEmail" type="email" className="ad-in" defaultValue={site.notifyEmail} placeholder="ken@yourdomain.com" /><span className="help">Never shown on the site. Contact form messages and advance reader signups are emailed here.</span></div>
          </section>
        </div>
      </div>
    </form>
  );
}
