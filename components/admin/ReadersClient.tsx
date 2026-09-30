'use client';
import { useState, useEffect } from 'react';
import type { Reader } from '@/lib/types';
import { deleteReaderAction, sendReaderEmailAction, markReadersSeenAction } from '@/app/admin/actions';
import { Ic } from '@/components/admin/AdIcons';
import Link from 'next/link';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const COLS = 'minmax(0,1.1fr) minmax(0,1.3fr) 110px 140px 60px';

export default function ReadersClient({
  readers,
  allReaders,
  nextBook,
  comingBooks,
  filter,
  totalAll,
  totalEbook,
  totalPaper,
  totalNewThisWeek,
}: {
  readers: Reader[];
  allReaders: Reader[];
  nextBook: string | null;
  comingBooks: { id: string, title: string }[];
  filter: string;
  totalAll: number;
  totalEbook: number;
  totalPaper: number;
  totalNewThisWeek: number;
}) {
  const week = Date.now() - 7 * 86_400_000;
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const rows = readers.filter(r => !deletedIds.has(r.id)); // Table rows (filtered by tab)
  const composerRows = allReaders.filter(r => !deletedIds.has(r.id)); // Composer rows (always all)

  useEffect(() => {
    markReadersSeenAction();
  }, []);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject] = useState(nextBook ? `Your advance copy of ${nextBook}` : 'A note for my advance readers');
  const [body, setBody] = useState('');
  const [bookId, setBookId] = useState('');

  // Recipient selection state — step 2
  const [step, setStep] = useState<'compose' | 'recipients'>('compose');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendAll, setSendAll] = useState(true); // default: send to all

  // Send state
  const [sendPending, setSendPending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  function openComposer() {
    setComposerOpen(true);
    setStep('compose');
    setSendAll(true);
    setSelected(new Set());
    setSendResult(null);
  }

  function closeComposer() {
    setComposerOpen(false);
    setStep('compose');
    setSendResult(null);
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === composerRows.length) setSelected(new Set());
    else setSelected(new Set(composerRows.map((r) => r.id)));
  }

  const recipientEmails = sendAll
    ? composerRows.map((r) => r.email)
    : composerRows.filter((r) => selected.has(r.id)).map((r) => r.email);

  const recipientCount = sendAll ? composerRows.length : selected.size;

  async function handleSend() {
    if (recipientEmails.length === 0) return;
    setSendPending(true);
    setSendResult(null);
    const fd = new FormData();
    fd.set('subject', subject);
    fd.set('body', body);
    if (bookId) fd.set('bookId', bookId);
    fd.set('recipients', JSON.stringify(recipientEmails));
    const res = await sendReaderEmailAction({}, fd);
    setSendPending(false);
    setSendResult(res);
  }

  async function removeReader(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    await deleteReaderAction(fd);
    setDeletedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="ad-top">
        <div>
          <h1>Advance readers</h1>
          <p>Everyone who signed up for early copies. Each new signup is also emailed to you.</p>
        </div>
        <div className="ad-actions">
          <a href="/admin/readers.csv" className="ad-btn"><Ic k="down" s={16} sw={1.8} />EXPORT CSV</a>
          {composerRows.length > 0 && (
            <button type="button" className="ad-btn pri" onClick={openComposer}>
              <Ic k="mail" s={16} sw={1.8} />EMAIL READERS
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="ad-stats">
        <div className="ad-stat"><span>TOTAL READERS</span><b>{totalAll}</b></div>
        <div className="ad-stat"><span>NEW THIS WEEK</span><b>{totalNewThisWeek}</b></div>
        <div className="ad-stat"><span>EBOOK / PAPERBACK</span><b>{totalEbook} / {totalPaper}</b></div>
        <div className="ad-stat"><span>NEXT BOOK</span><b style={{ fontSize: 26, lineHeight: 1.5 }}>{nextBook || 'None set'}</b></div>
      </div>

      {/* ── Email Composer Modal ── */}
      {composerOpen && (
        <div style={{
          background: 'rgba(22,18,14,.98)',
          border: '1px solid rgba(201,168,96,.25)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Composer header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderBottom: '1px solid rgba(239,231,214,.08)',
            background: 'rgba(201,168,96,.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setStep('compose'); setSendResult(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: step === 'compose' ? 'rgba(201,168,96,.15)' : 'none',
                    border: `1px solid ${step === 'compose' ? 'rgba(201,168,96,.4)' : 'transparent'}`,
                    borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
                    fontSize: 12, letterSpacing: '.1em',
                    color: step === 'compose' ? '#c9a860' : 'var(--muted)'
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: step === 'compose' ? '#c9a860' : 'rgba(239,231,214,.15)',
                    color: step === 'compose' ? '#1b1814' : 'var(--muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>1</span>
                  WRITE EMAIL
                </button>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>›</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: step === 'recipients' ? 'rgba(201,168,96,.15)' : 'none',
                  border: `1px solid ${step === 'recipients' ? 'rgba(201,168,96,.4)' : 'transparent'}`,
                  borderRadius: 4, padding: '4px 10px',
                  fontSize: 12, letterSpacing: '.1em',
                  color: step === 'recipients' ? '#c9a860' : 'var(--muted)'
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: step === 'recipients' ? '#c9a860' : 'rgba(239,231,214,.15)',
                    color: step === 'recipients' ? '#1b1814' : 'var(--muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>2</span>
                  CHOOSE RECIPIENTS
                </div>
              </div>
            </div>
            <button type="button" className="ad-sm icon" onClick={closeComposer} aria-label="Close composer">
              <Ic k="x" s={16} />
            </button>
          </div>

          {/* Step 1 — Write email */}
          {step === 'compose' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="ad-field">
                <label className="ad-label" htmlFor="em-subject">SUBJECT LINE</label>
                <input
                  id="em-subject"
                  className="ad-in"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your advance copy is ready"
                />
              </div>
              <div className="ad-field">
                <label className="ad-label" htmlFor="em-body">MESSAGE BODY</label>
                <textarea
                  id="em-body"
                  className="ad-in"
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Hi,\n\nThank you for signing up as an advance reader…\n\nBest,\nKen`}
                  style={{ fontFamily: 'inherit', lineHeight: 1.75 }}
                />
                <span className="help">Plain text only. Each reader gets a personal email — no one sees others' addresses.</span>
              </div>
              <div className="ad-field">
                <label className="ad-label" htmlFor="em-book">ATTACH SAMPLE PDF (OPTIONAL)</label>
                <select id="em-book" className="ad-in" value={bookId} onChange={(e) => setBookId(e.target.value)}>
                  <option value="">No attachment</option>
                  {comingBooks.map(b => <option key={b.id} value={b.id}>{b.title} (PDF)</option>)}
                </select>
                <span className="help">Automatically generates a PDF from the book's sample text and attaches it.</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="ad-btn pri"
                  disabled={!subject.trim() || !body.trim()}
                  onClick={() => setStep('recipients')}
                >
                  CHOOSE RECIPIENTS <Ic k="caretDown" s={14} />
                </button>
                <button type="button" className="ad-sm" onClick={closeComposer}>Cancel</button>
              </div>
            </div>
          )}

          {/* Step 2 — Choose recipients */}
          {step === 'recipients' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!sendResult?.ok && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="ad-label">WHO RECEIVES THIS EMAIL?</span>

                {/* Send to All option */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${sendAll ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: sendAll ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={sendAll}
                    onChange={() => setSendAll(true)}
                    style={{ width: 16, height: 16, accentColor: '#c9a860', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>
                      Send to all readers
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {composerRows.length} reader{composerRows.length !== 1 ? 's' : ''} will receive this email
                    </div>
                  </div>
                  {sendAll && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      SELECTED
                    </span>
                  )}
                </label>

                {/* Select individual option */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${!sendAll ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: !sendAll ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={!sendAll}
                    onChange={() => setSendAll(false)}
                    style={{ width: 16, height: 16, accentColor: '#c9a860', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>
                      Select specific readers
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {!sendAll && selected.size > 0
                        ? `${selected.size} reader${selected.size !== 1 ? 's' : ''} selected`
                        : 'Choose individual readers below'}
                    </div>
                  </div>
                  {!sendAll && selected.size > 0 && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      {selected.size} SELECTED
                    </span>
                  )}
                </label>
              </div>

              {/* Individual reader checklist */}
              {!sendAll && (
                <div style={{
                  border: '1px solid rgba(239,231,214,.08)', borderRadius: 6,
                  overflow: 'hidden', maxHeight: 320, overflowY: 'auto'
                }}>
                  {/* Select all header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderBottom: '1px solid rgba(239,231,214,.08)',
                    background: 'rgba(239,231,214,.03)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--muted)', letterSpacing: '.1em' }}>
                      <input
                        type="checkbox"
                        checked={selected.size === composerRows.length && composerRows.length > 0}
                        onChange={toggleAll}
                        style={{ width: 15, height: 15, accentColor: '#c9a860', cursor: 'pointer' }}
                      />
                      SELECT ALL
                    </label>
                  </div>
                  {composerRows.map((r) => (
                    <label
                      key={r.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 16px', cursor: 'pointer',
                        borderBottom: '1px solid rgba(239,231,214,.05)',
                        background: selected.has(r.id) ? 'rgba(201,168,96,.05)' : 'transparent',
                        transition: 'background .1s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        style={{ width: 15, height: 15, accentColor: '#c9a860', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--cream)' }}>{r.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.email}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 7px',
                        background: r.format === 'Ebook' ? 'rgba(100,160,220,.12)' : 'rgba(150,120,80,.12)',
                        color: r.format === 'Ebook' ? '#88b8e8' : '#b89a6a',
                        borderRadius: 3
                      }}>{r.format}</span>
                    </label>
                  ))}
                  </div>
              )}
              </>
            )}

              {/* Send result */}
              {sendResult?.error && <div className="ad-err" role="alert">{sendResult.error}</div>}
              {sendResult?.ok && (
                <div className="ad-ok" role="status" style={{ margin: '20px 0' }}>
                  <Ic k="check" s={16} sw={2} />Email sent to {recipientCount} reader{recipientCount !== 1 ? 's' : ''} successfully!
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {!sendResult?.ok ? (
                  <>
                    <button
                      type="button"
                      className="ad-btn pri"
                      disabled={sendPending || recipientCount === 0}
                      onClick={handleSend}
                      style={{ fontSize: 13 }}
                    >
                      <Ic k="mail" s={14} sw={1.8} />
                      {sendPending
                        ? 'SENDING…'
                        : `SEND TO ${recipientCount || '—'} READER${recipientCount !== 1 ? 'S' : ''}`}
                    </button>
                    <button type="button" className="ad-sm" onClick={() => setStep('compose')}>
                      ← Back to email
                    </button>
                    <button type="button" className="ad-sm" onClick={closeComposer}>Cancel</button>
                  </>
                ) : (
                  <button type="button" className="ad-btn" onClick={closeComposer}>Done</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <nav className="ad-tabs" aria-label="Filter readers">
        <Link href="/admin/readers" className={filter === 'all' ? 'on' : ''}>All readers</Link>
        <Link href="/admin/readers?f=ebook" className={filter === 'ebook' ? 'on' : ''}>Ebook</Link>
        <Link href="/admin/readers?f=paper" className={filter === 'paper' ? 'on' : ''}>Paperback</Link>
      </nav>

      {/* ── Table ── */}
      <div className="ad-table">
        <div className="ad-tr head" style={{ gridTemplateColumns: COLS }}>
          <span>NAME</span><span>EMAIL</span><span>FORMAT</span><span>SIGNED UP</span><span />
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 28, color: 'var(--muted)' }}>
            No signups yet. They appear here the moment someone joins from the homepage.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, height: 68, fontSize: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              {new Date(r.createdAt).getTime() > week && (
                <span className="pill gold" style={{ height: 20, fontSize: 11, flexShrink: 0 }}>New</span>
              )}
            </span>
            <span style={{ color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
            <span style={{ color: 'var(--soft)' }}>{r.format}</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDate(r.createdAt)}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ad-sm icon danger"
                aria-label={`Remove ${r.name}`}
                onClick={() => removeReader(r.id)}
              >
                <Ic k="trash" s={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
