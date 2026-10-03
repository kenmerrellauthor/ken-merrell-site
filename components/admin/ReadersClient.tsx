'use client';
import { useState, useEffect } from 'react';
import type { Reader } from '@/lib/types';
import { deleteReaderAction, sendReaderEmailAction, markReadersSeenAction, addReaderAdminAction, updateReaderAction } from '@/app/admin/actions';
import { Ic } from '@/components/admin/AdIcons';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import type { CrmNotification } from '@/lib/types';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const COLS = 'minmax(0,1.1fr) minmax(0,1.3fr) 130px 140px 90px';

export default function ReadersClient({
  readers,
  allReaders,
  nextBook,
  comingBooks = [],
  books = [],
  filter,
  totalAll,
  totalEbook,
  totalPaper,
  totalNewThisWeek,
  notifications = [],
  unreadCount = 0,
}: {
  readers: Reader[];
  allReaders: Reader[];
  nextBook: string | null;
  comingBooks?: { id: string; title: string; status?: string; hasSample?: boolean; amazonUrl?: string }[];
  books?: { id: string; title: string; status: 'available' | 'coming'; hasSample?: boolean; amazonUrl?: string }[];
  filter: string;
  totalAll: number;
  totalEbook: number;
  totalPaper: number;
  totalNewThisWeek: number;
  notifications?: CrmNotification[];
  unreadCount?: number;
}) {
  const week = Date.now() - 7 * 86_400_000;
  const [readerList, setReaderList] = useState<Reader[]>(allReaders);

  useEffect(() => {
    setReaderList(allReaders);
  }, [allReaders]);

  // Add reader state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addFormat, setAddFormat] = useState('Ebook');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit reader state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFormat, setEditFormat] = useState('Ebook');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');

  const rows = readerList.filter((r) => {
    const fmt = (r.format || '').toLowerCase();
    if (filter === 'ebook') return fmt.includes('ebook');
    if (filter === 'paper') return fmt.includes('paper');
    return true;
  });
  const composerRows = readerList;
  const paperbackRows = composerRows.filter((r) => r.format?.toLowerCase().includes('paper'));
  const ebookRows = composerRows.filter((r) => r.format?.toLowerCase().includes('ebook'));

  const availableBooks = books.length > 0
    ? books
    : comingBooks.map(b => ({ ...b, status: (b.status || 'coming') as 'available' | 'coming', amazonUrl: b.amazonUrl || '' }));
  const comingSoonList = availableBooks.filter(b => b.status === 'coming');
  const otherBooksList = availableBooks.filter(b => b.status !== 'coming');

  useEffect(() => {
    markReadersSeenAction();
  }, []);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject] = useState(nextBook ? `Your advance copy of ${nextBook}` : 'A note for my advance readers');
  const [body, setBody] = useState('');
  const [bookId, setBookId] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');

  // Recipient selection state — step 2
  const [step, setStep] = useState<'compose' | 'recipients'>('compose');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recipMode, setRecipMode] = useState<'all' | 'paperback' | 'ebook' | 'custom'>('all');

  // Send state
  const [sendPending, setSendPending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  function openComposer(initialMode: 'all' | 'paperback' | 'ebook' | 'custom' = 'all') {
    setComposerOpen(true);
    setStep('compose');
    setRecipMode(initialMode);
    setSelected(new Set());
    setSendResult(null);

    // If a coming book or active book has amazonUrl and none set yet, pre-fill it
    if (!amazonUrl) {
      const defaultBook = comingSoonList.find(b => b.amazonUrl) || availableBooks.find(b => b.amazonUrl);
      if (defaultBook?.amazonUrl) {
        setAmazonUrl(defaultBook.amazonUrl);
      }
    }
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

  let recipientEmails: string[] = [];
  if (recipMode === 'all') {
    recipientEmails = composerRows.map((r) => r.email);
  } else if (recipMode === 'paperback') {
    recipientEmails = paperbackRows.map((r) => r.email);
  } else if (recipMode === 'ebook') {
    recipientEmails = ebookRows.map((r) => r.email);
  } else {
    recipientEmails = composerRows.filter((r) => selected.has(r.id)).map((r) => r.email);
  }

  const recipientCount = recipientEmails.length;

  async function handleSend() {
    if (recipientEmails.length === 0) return;
    setSendPending(true);
    setSendResult(null);
    const fd = new FormData();
    fd.set('subject', subject);
    fd.set('body', body);
    if (bookId) fd.set('bookId', bookId);
    if (amazonUrl) fd.set('amazonUrl', amazonUrl);
    fd.set('recipients', JSON.stringify(recipientEmails));
    const res = await sendReaderEmailAction({}, fd);
    setSendPending(false);
    setSendResult(res);
  }

  async function removeReader(id: string) {
    if (!confirm('Remove this reader from your advance list?')) return;
    const fd = new FormData();
    fd.set('id', id);
    await deleteReaderAction(fd);
    setReaderList((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleAddReader(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) { setAddError('Please enter an email.'); return; }
    setAddBusy(true);
    setAddError('');
    const fd = new FormData();
    fd.set('name', addName.trim());
    fd.set('email', addEmail.trim());
    fd.set('format', addFormat);
    const res = await addReaderAdminAction({}, fd);
    setAddBusy(false);
    if (res.error) {
      setAddError(res.error);
      return;
    }
    if (res.reader) {
      setReaderList((prev) => [res.reader!, ...prev.filter(x => x.id !== res.reader!.id)]);
    }
    setAddName('');
    setAddEmail('');
    setAddFormat('Ebook');
    setAddOpen(false);
  }

  function startEdit(r: Reader) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditEmail(r.email);
    setEditFormat(r.format || 'Ebook');
    setEditError('');
  }

  async function handleSaveEdit(id: string) {
    if (!editEmail.trim()) { setEditError('Please enter an email.'); return; }
    setEditBusy(true);
    setEditError('');
    const fd = new FormData();
    fd.set('id', id);
    fd.set('name', editName.trim());
    fd.set('email', editEmail.trim());
    fd.set('format', editFormat);
    const res = await updateReaderAction({}, fd);
    setEditBusy(false);
    if (res.error) {
      setEditError(res.error);
      return;
    }
    if (res.reader) {
      setReaderList((prev) => prev.map((x) => x.id === id ? res.reader! : x));
    }
    setEditingId(null);
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
          <button
            type="button"
            className={`ad-btn${addOpen ? ' pri' : ''}`}
            onClick={() => {
              setAddOpen((v) => !v);
              setComposerOpen(false);
            }}
          >
            <Ic k={addOpen ? 'x' : 'plus'} s={16} sw={1.8} />
            {addOpen ? 'CANCEL' : 'ADD READER'}
          </button>
          <a href="/admin/readers.csv" className="ad-btn"><Ic k="down" s={16} sw={1.8} />EXPORT CSV</a>
          {composerRows.length > 0 && (
            <button
              type="button"
              className={`ad-btn${composerOpen ? ' pri' : ''}`}
              onClick={() => {
                if (composerOpen) {
                  closeComposer();
                } else {
                  openComposer('all');
                  setAddOpen(false);
                }
              }}
            >
              <Ic k={composerOpen ? 'x' : 'mail'} s={16} sw={1.8} />
              {composerOpen ? 'CLOSE EMAIL' : 'EMAIL READERS'}
            </button>
          )}
        </div>
      </div>

      {/* ── Add Reader Card ── */}
      {addOpen && (
        <form onSubmit={handleAddReader} className="ad-card" style={{ background: 'rgba(201,168,96,.04)', border: '1px solid rgba(201,168,96,.3)', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 20 }}>Add an advance reader</h2>
            <button type="button" className="ad-sm icon" onClick={() => setAddOpen(false)} aria-label="Close"><Ic k="x" s={16} /></button>
          </div>
          <p className="sub" style={{ margin: 0 }}>Manually add a reader who requested an early copy in person, at a book event, or via email.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px auto', gap: 14, alignItems: 'end' }}>
            <div className="ad-field">
              <label className="ad-label" htmlFor="ar-name">NAME</label>
              <input id="ar-name" className="ad-in" placeholder="e.g. Jane Smith" value={addName} onChange={(e) => setAddName(e.target.value)} />
            </div>
            <div className="ad-field">
              <label className="ad-label" htmlFor="ar-email">EMAIL</label>
              <input id="ar-email" type="email" required className="ad-in" placeholder="reader@example.com" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
            </div>
            <div className="ad-field">
              <label className="ad-label" htmlFor="ar-format">PREFERENCE</label>
              <select id="ar-format" className="ad-in" value={addFormat} onChange={(e) => setAddFormat(e.target.value)}>
                <option value="Ebook">Ebook</option>
                <option value="Paperback">Paperback</option>
                <option value="Ebook & Paperback">Both</option>
              </select>
            </div>
            <button type="submit" className="ad-btn pri" disabled={addBusy} style={{ height: 48, alignSelf: 'end' }}>
              <Ic k="plus" s={16} />{addBusy ? 'ADDING…' : 'ADD READER'}
            </button>
          </div>
          {addError && <div className="ad-err" role="alert">{addError}</div>}
        </form>
      )}

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
                <label className="ad-label" htmlFor="em-book">ATTACH BOOK SAMPLE (PDF)</label>
                <select
                  id="em-book"
                  className="ad-in"
                  value={bookId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBookId(id);
                    const found = availableBooks.find((b) => b.id === id);
                    if (found) {
                      if (!subject || subject === 'A note for my advance readers' || subject.startsWith('Your advance copy of ')) {
                        setSubject(`Your advance copy of ${found.title}`);
                      }
                      if (found.amazonUrl) {
                        setAmazonUrl(found.amazonUrl);
                      }
                    }
                  }}
                >
                  <option value="">No attachment (Text only email)</option>
                  {comingSoonList.length > 0 && (
                    <optgroup label="Coming Soon Books">
                      {comingSoonList.map((b) => (
                        <option key={b.id} value={b.id}>
                          ⭐ {b.title} (Coming Soon{b.hasSample ? ' · Sample PDF' : ''})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <span className="help">
                  Automatically generates a formatted PDF from the book's sample text and attaches it to each email.
                </span>
              </div>

              {/* Amazon Buy Link field for paperback applicants */}
              <div className="ad-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <label className="ad-label" htmlFor="em-amazon">
                    AMAZON BUY LINK (FOR PAPERBACK READERS)
                  </label>
                  {amazonUrl && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold)',
                        fontSize: 12,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                      onClick={() => {
                        if (!body.includes(amazonUrl)) {
                          setBody((prev) => `${prev.trim()}\n\nOrder Paperback on Amazon:\n${amazonUrl}\n`);
                        }
                      }}
                    >
                      + Insert link in email body
                    </button>
                  )}
                </div>
                <input
                  id="em-amazon"
                  className="ad-in"
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/…"
                />
                <span className="help">
                  When emailing readers (especially paperback applicants), this link is automatically formatted as an Amazon buy button in the email.
                </span>
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
                  border: `1.5px solid ${recipMode === 'all' ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: recipMode === 'all' ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={recipMode === 'all'}
                    onChange={() => setRecipMode('all')}
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
                  {recipMode === 'all' && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      SELECTED
                    </span>
                  )}
                </label>

                {/* Paperback readers only */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${recipMode === 'paperback' ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: recipMode === 'paperback' ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={recipMode === 'paperback'}
                    onChange={() => setRecipMode('paperback')}
                    style={{ width: 16, height: 16, accentColor: '#c9a860', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>
                        Paperback readers only
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(201,168,96,.2)', color: 'var(--gold)', borderRadius: 3, fontWeight: 600 }}>
                        Includes Amazon Buy Link
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {paperbackRows.length} reader{paperbackRows.length !== 1 ? 's' : ''} who applied for paperback copies
                      {amazonUrl ? ' · Amazon buy link is active' : ' · (Tip: add Amazon link in Step 1)'}
                    </div>
                  </div>
                  {recipMode === 'paperback' && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      SELECTED
                    </span>
                  )}
                </label>

                {/* Ebook readers only */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${recipMode === 'ebook' ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: recipMode === 'ebook' ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={recipMode === 'ebook'}
                    onChange={() => setRecipMode('ebook')}
                    style={{ width: 16, height: 16, accentColor: '#c9a860', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>
                      Ebook readers only
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {ebookRows.length} reader{ebookRows.length !== 1 ? 's' : ''} who requested digital copies
                    </div>
                  </div>
                  {recipMode === 'ebook' && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      SELECTED
                    </span>
                  )}
                </label>

                {/* Select specific readers */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 6, cursor: 'pointer',
                  border: `1.5px solid ${recipMode === 'custom' ? 'rgba(201,168,96,.5)' : 'rgba(239,231,214,.1)'}`,
                  background: recipMode === 'custom' ? 'rgba(201,168,96,.07)' : 'rgba(239,231,214,.02)',
                  transition: 'all .15s ease'
                }}>
                  <input
                    type="radio"
                    name="recipMode"
                    checked={recipMode === 'custom'}
                    onChange={() => setRecipMode('custom')}
                    style={{ width: 16, height: 16, accentColor: '#c9a860', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>
                      Select specific readers
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {recipMode === 'custom' && selected.size > 0
                        ? `${selected.size} reader${selected.size !== 1 ? 's' : ''} selected`
                        : 'Choose individual readers below'}
                    </div>
                  </div>
                  {recipMode === 'custom' && selected.size > 0 && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,96,.15)', color: '#c9a860', borderRadius: 3, letterSpacing: '.1em' }}>
                      {selected.size} SELECTED
                    </span>
                  )}
                </label>
              </div>

              {/* Paperback Amazon Buy Link info callout */}
              {recipMode === 'paperback' && (
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(201,168,96,.08)',
                  border: '1px solid rgba(201,168,96,.25)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{ fontSize: 20 }}>📦</span>
                  <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.5 }}>
                    <b>Amazon Buy Link Included:</b> Readers will receive a prominent &ldquo;ORDER PAPERBACK ON AMAZON&rdquo; button and direct link.
                    {amazonUrl ? (
                      <span style={{ display: 'block', color: 'var(--gold)', marginTop: 4, wordBreak: 'break-all' }}>
                        Active link: {amazonUrl}
                      </span>
                    ) : (
                      <span style={{ display: 'block', color: '#e58a78', marginTop: 4 }}>
                        ⚠️ No Amazon link specified yet. <button type="button" onClick={() => setStep('compose')} style={{ background: 'none', border: 'none', color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Add Amazon link in Step 1</button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Individual reader checklist */}
              {recipMode === 'custom' && (
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
                        background: r.format === 'Ebook' ? 'rgba(100,160,220,.12)' : r.format === 'Paperback' ? 'rgba(150,120,80,.14)' : 'rgba(201,168,96,.16)',
                        color: r.format === 'Ebook' ? '#88b8e8' : r.format === 'Paperback' ? '#d4b47a' : '#c9a860',
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
                  <button type="button" className="ad-btn" onClick={() => {
                    setSubject(nextBook ? `Your advance copy of ${nextBook}` : 'A note for my advance readers');
                    setBody('');
                    setBookId('');
                    setAmazonUrl('');
                    closeComposer();
                  }}>Done</button>
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
          <span>NAME</span><span>EMAIL</span><span>FORMAT</span><span>SIGNED UP</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 28, color: 'var(--muted)' }}>
            No signups yet. They appear here the moment someone joins from the homepage or is added above.
          </div>
        )}
        {rows.map((r) => {
          const isEditing = editingId === r.id;
          if (isEditing) {
            return (
              <div key={r.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, minHeight: 74, fontSize: 14, background: 'rgba(201,168,96,.06)' }}>
                <div>
                  <input className="ad-in" style={{ height: 38, fontSize: 14 }} placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <input className="ad-in" type="email" style={{ height: 38, fontSize: 14 }} placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div>
                  <select className="ad-in" style={{ height: 38, fontSize: 13 }} value={editFormat} onChange={(e) => setEditFormat(e.target.value)}>
                    <option value="Ebook">Ebook</option>
                    <option value="Paperback">Paperback</option>
                    <option value="Ebook & Paperback">Both</option>
                  </select>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {editError ? <span style={{ color: '#e58a78' }}>{editError}</span> : fmtDate(r.createdAt)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    className="ad-sm icon"
                    title="Save changes"
                    disabled={editBusy}
                    onClick={() => handleSaveEdit(r.id)}
                    style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}
                  >
                    <Ic k="check" s={15} />
                  </button>
                  <button
                    type="button"
                    className="ad-sm icon"
                    title="Cancel"
                    disabled={editBusy}
                    onClick={() => setEditingId(null)}
                  >
                    <Ic k="x" s={15} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={r.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, height: 68, fontSize: 15 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                {new Date(r.createdAt).getTime() > week && (
                  <span className="pill gold" style={{ height: 20, fontSize: 11, flexShrink: 0 }}>New</span>
                )}
              </span>
              <span style={{ color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
              <span>
                <span style={{
                  fontSize: 12, padding: '3px 8px', borderRadius: 3,
                  background: r.format === 'Ebook' ? 'rgba(100,160,220,.12)' : r.format === 'Paperback' ? 'rgba(150,120,80,.14)' : 'rgba(201,168,96,.16)',
                  color: r.format === 'Ebook' ? '#88b8e8' : r.format === 'Paperback' ? '#d4b47a' : '#c9a860'
                }}>
                  {r.format}
                </span>
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDate(r.createdAt)}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  type="button"
                  className="ad-sm icon"
                  aria-label={`Edit ${r.name}`}
                  title={`Edit ${r.name}`}
                  onClick={() => startEdit(r)}
                >
                  <Ic k="edit" s={15} />
                </button>
                <button
                  type="button"
                  className="ad-sm icon danger"
                  aria-label={`Remove ${r.name}`}
                  title={`Remove ${r.name}`}
                  onClick={() => removeReader(r.id)}
                >
                  <Ic k="trash" s={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
