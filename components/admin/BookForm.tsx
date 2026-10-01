'use client';
import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Book, Quote, Review, Video } from '@/lib/types';
import { deleteBookAction, saveBookAction, approveReviewAction, rejectReviewAction, saveReviewCommentAction, deleteReviewAction, addReviewAction, updateReviewContentAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';
import { ImagePick } from './ImagePick';
import { parseYouTubeId } from '@/lib/youtube';

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



/* ─── Standalone add-review form — MUST stay outside the main <form> ─── */
function AddReviewForm({ bookId, onDone }: { bookId: string; onDone: (review: Review) => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('bookId', bookId);
    fd.set('rating', String(rating));
    const res = await addReviewAction({}, fd);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    if (!res.review) { setError('Unexpected error — please refresh.'); return; }
    formRef.current?.reset();
    setRating(0);
    setError('');
    onDone(res.review);
  }

  const displayed = hovered || rating;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0 4px', borderTop: '1px solid rgba(239,231,214,.1)' }}
    >
      <span className="ad-label">ADD A REVIEW MANUALLY</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Manually added reviews are immediately published on the book page.</p>

      <div className="ad-grid2">
        <div className="ad-field">
          <label className="ad-label" htmlFor="nr-name">REVIEWER NAME</label>
          <input id="nr-name" name="name" className="ad-in" placeholder="Jane Smith" required />
        </div>
        <div className="ad-field">
          <span className="ad-label">STAR RATING</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 48 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0, transition: 'transform .1s ease', transform: hovered === star ? 'scale(1.2)' : 'scale(1)' }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24"
                  fill={star <= displayed ? '#c9a860' : 'none'}
                  stroke={star <= displayed ? '#c9a860' : '#4a4137'}
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
            <span style={{ fontSize: 13, color: rating ? 'var(--cream)' : 'var(--muted)', marginLeft: 4 }}>
              {rating ? `${rating}/5` : 'Select rating'}
            </span>
          </div>
        </div>
      </div>

      <div className="ad-field">
        <label className="ad-label" htmlFor="nr-text">REVIEW TEXT</label>
        <textarea id="nr-text" name="text" className="ad-in" rows={4} placeholder="Write the review here…" required />
      </div>

      <div className="ad-field">
        <label className="ad-label" htmlFor="nr-comment">YOUR NOTE <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — shown publicly under the review)</span></label>
        <input id="nr-comment" name="adminComment" className="ad-in" placeholder="e.g. Received via email" />
      </div>

      {error && <div className="ad-err" role="alert">{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="ad-btn pri" disabled={busy} style={{ fontSize: 13 }}>
          <Ic k="check" s={14} sw={2} />{busy ? 'PUBLISHING…' : 'PUBLISH REVIEW'}
        </button>
      </div>
    </form>
  );
}

function StarRow({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map((k) => (
        <svg key={k} width={14} height={14} viewBox="0 0 24 24"
          fill={k <= n ? '#c9a860' : 'none'}
          stroke={k <= n ? '#c9a860' : '#6e6457'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

export default function BookForm({ book, isNew, videos = [] }: { book: Book; isNew: boolean; videos?: Video[] }) {
  const router = useRouter();

  const [state, action] = useActionState<AdminState, FormData>(saveBookAction, {});
  const [status, setStatus] = useState(book.status);
  const [audible, setAudible] = useState(!!book.audibleUrl);
  const [videoUrl, setVideoUrl] = useState(book.videoUrl || '');
  const [quotes, setQuotes] = useState<Quote[]>(book.quotes.length ? book.quotes : []);
  const [fileName, setFileName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(book.reviews ?? []);
  const [commentEdit, setCommentEdit] = useState<Record<string, string>>({});
  const [showAddReview, setShowAddReview] = useState(false);

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
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  function ReviewRow({ r, bookId }: { r: Review; bookId: string }) {
    const [busy, setBusy] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(r.name);
    const [editRating, setEditRating] = useState(r.rating);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [editText, setEditText] = useState(r.text);
    const [editNote, setEditNote] = useState(r.adminComment ?? '');
    const [editError, setEditError] = useState('');

    const edited = commentEdit[r.id] ?? r.adminComment ?? '';
    async function doApprove() {
      setBusy(true);
      const fd = new FormData();
      fd.set('bookId', bookId); fd.set('reviewId', r.id);
      fd.set('adminComment', commentEdit[r.id] ?? r.adminComment ?? '');
      await approveReviewAction(fd);
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, approved: true } : x));
      setBusy(false);
    }
    async function doReject() {
      setBusy(true);
      const fd = new FormData();
      fd.set('bookId', bookId); fd.set('reviewId', r.id);
      await rejectReviewAction(fd);
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, approved: false } : x));
      setBusy(false);
    }
    async function doSaveComment() {
      setBusy(true);
      const fd = new FormData();
      fd.set('bookId', bookId); fd.set('reviewId', r.id);
      fd.set('adminComment', edited);
      await saveReviewCommentAction(fd);
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, adminComment: edited || undefined } : x));
      setBusy(false);
    }
    async function doDelete() {
      if (!confirm('Remove this review permanently?')) return;
      setBusy(true);
      const fd = new FormData();
      fd.set('bookId', bookId); fd.set('reviewId', r.id);
      await deleteReviewAction(fd);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      setBusy(false);
    }
    async function doSaveEdit() {
      if (!editName.trim()) { setEditError('Reviewer name is required.'); return; }
      if (!editText.trim()) { setEditError('Review text is required.'); return; }
      setBusy(true);
      setEditError('');
      const fd = new FormData();
      fd.set('bookId', bookId);
      fd.set('reviewId', r.id);
      fd.set('name', editName.trim());
      fd.set('rating', String(editRating));
      fd.set('text', editText.trim());
      fd.set('adminComment', editNote.trim());
      const res = await updateReviewContentAction({}, fd);
      setBusy(false);
      if (res.error) {
        setEditError(res.error);
        return;
      }
      if (res.review) {
        setReviews((prev) => prev.map((x) => x.id === r.id ? res.review! : x));
      }
      setIsEditing(false);
    }

    if (isEditing) {
      const displayed = hoveredStar || editRating;
      return (
        <div style={{ borderBottom: '1px solid rgba(239,231,214,.08)', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(201,168,96,.04)', padding: 16, borderRadius: 6, border: '1px solid rgba(201,168,96,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ad-label" style={{ color: 'var(--gold)' }}>UPDATE REVIEW</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="ad-grid2">
            <div className="ad-field">
              <label className="ad-label">REVIEWER NAME</label>
              <input className="ad-in" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="ad-field">
              <span className="ad-label">STAR RATING</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 48 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0 }}
                  >
                    <svg width={22} height={22} viewBox="0 0 24 24"
                      fill={star <= displayed ? '#c9a860' : 'none'}
                      stroke={star <= displayed ? '#c9a860' : '#4a4137'} strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
                <span style={{ fontSize: 13, color: 'var(--cream)', marginLeft: 6 }}>{editRating}/5</span>
              </div>
            </div>
          </div>

          <div className="ad-field">
            <label className="ad-label">REVIEW TEXT</label>
            <textarea className="ad-in" rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
          </div>

          <div className="ad-field">
            <label className="ad-label">YOUR NOTE / CRM COMMENT</label>
            <input className="ad-in" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="e.g. Verified purchase" />
          </div>

          {editError && <div className="ad-err" role="alert">{editError}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
            <button type="button" className="ad-btn pri" onClick={doSaveEdit} disabled={busy} style={{ fontSize: 12, padding: '6px 16px' }}>
              <Ic k="check" s={14} sw={2} />{busy ? 'SAVING…' : 'SAVE CHANGES'}
            </button>
            <button type="button" className="ad-sm" onClick={() => setIsEditing(false)} disabled={busy} style={{ fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ borderBottom: '1px solid rgba(239,231,214,.08)', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <StarRow n={r.rating} />
          <b style={{ fontSize: 14 }}>{r.name}</b>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', background: r.approved ? 'rgba(100,180,100,.15)' : 'rgba(201,168,96,.12)', color: r.approved ? '#6dbf78' : '#c9a860', borderRadius: 2 }}>
            {r.approved ? 'APPROVED' : 'PENDING'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--soft-2)', lineHeight: 1.6 }}>{r.text}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--muted)' }}>YOUR NOTE / CRM COMMENT (shown publicly under the review)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="ad-in"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="Add a personal note to this review (optional)"
              value={edited}
              onChange={(e) => setCommentEdit({ ...commentEdit, [r.id]: e.target.value })}
            />
            <button type="button" className="ad-sm" onClick={doSaveComment} disabled={busy} style={{ whiteSpace: 'nowrap' }}>Save note</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!r.approved && <button type="button" className="ad-btn pri" onClick={doApprove} disabled={busy} style={{ fontSize: 12, padding: '6px 14px' }}><Ic k="check" s={14} sw={2} />Approve</button>}
          {r.approved && <button type="button" className="ad-sm" onClick={doReject} disabled={busy} style={{ fontSize: 12 }}>Unpublish</button>}
          <button type="button" className="ad-sm" onClick={() => setIsEditing(true)} disabled={busy} style={{ fontSize: 12 }}><Ic k="edit" s={14} />Edit</button>
          <button type="button" className="ad-sm danger" onClick={doDelete} disabled={busy} style={{ fontSize: 12, marginLeft: 'auto' }}><Ic k="trash" s={14} />Delete</button>
        </div>
      </div>
    );
  }

  /* ── Reviews card — rendered OUTSIDE the main <form> to avoid nesting ── */
  const ReviewsCard = !isNew ? (
    <section className="ad-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{ margin: 0 }}>
          Reader Reviews{' '}
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>
            ({reviews.length} total · {pending.length} pending)
          </span>
        </h2>
        <button
          type="button"
          className="ad-btn pri"
          style={{ fontSize: 12, padding: '8px 16px' }}
          onClick={() => setShowAddReview((v) => !v)}
        >
          <Ic k="plus" s={14} />{showAddReview ? 'CANCEL' : 'ADD REVIEW'}
        </button>
      </div>

      {showAddReview && (
        <AddReviewForm
          bookId={book.id}
          onDone={(newReview) => {
            setReviews((prev) => [newReview, ...prev]);
            setShowAddReview(false);
          }}
        />
      )}

      {reviews.length === 0 && !showAddReview && (
        <p className="sub">No reviews yet. Add one manually above, or they appear here once readers submit from the book page.</p>
      )}
      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <span className="ad-label">PENDING APPROVAL</span>
          {pending.map((r) => <ReviewRow key={r.id} r={r} bookId={book.id} />)}
        </div>
      )}
      {approved.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: pending.length ? 24 : 16 }}>
          <span className="ad-label">PUBLISHED ({approved.length})</span>
          {approved.map((r) => <ReviewRow key={r.id} r={r} bookId={book.id} />)}
        </div>
      )}
    </section>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/admin">Books</Link><span>/</span><span style={{ color: 'var(--soft)' }}>{isNew ? 'Add a book' : 'Edit book'}</span></nav>

      {/* ── Main book-save form ── */}
      <form action={action} onChange={() => setDirty(true)}>
        <input type="hidden" name="id" value={book.id} />
        <input type="hidden" name="quotes" value={JSON.stringify(quotes)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
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
                <Field label="BANNER TITLE" name="displayTitle" value={book.displayTitle} placeholder="Petticoats *and a*|Traitor's Death" help="How the title looks in big banners. Put small words in *stars* to make them gold italics, and use | to start a new line." />
              </section>

              <section className="ad-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Ic k="video" s={22} />
                      Book video &amp; trailer
                    </h2>
                    <p className="sub" style={{ marginTop: 6 }}>
                      Displays an official video or reading trailer before the sample chapter reader.
                    </p>
                  </div>
                  <span className={`pill ${videoUrl ? 'gold' : 'off'}`} style={{ fontSize: 11, letterSpacing: '.1em' }}>
                    {videoUrl ? 'VIDEO ACTIVE' : 'OPTIONAL'}
                  </span>
                </div>

                {videos.length > 0 && (
                  <div className="ad-field">
                    <label className="ad-label" htmlFor="bf-video-select">CHOOSE FROM YOUR VIDEO GALLERY</label>
                    <select
                      id="bf-video-select"
                      className="ad-in"
                      value={videos.some(v => v.youtubeId && videoUrl.includes(v.youtubeId)) ? (videos.find(v => v.youtubeId && videoUrl.includes(v.youtubeId))?.id || '') : ''}
                      onChange={(e) => {
                        const sel = videos.find(v => v.id === e.target.value);
                        if (sel && sel.youtubeId) {
                          setVideoUrl(`https://www.youtube.com/watch?v=${sel.youtubeId}`);
                          setDirty(true);
                        }
                      }}
                    >
                      <option value="">-- Choose an uploaded video or enter custom link below --</option>
                      {videos.filter(v => v.youtubeId).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title} ({v.type || 'Trailer'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="ad-field">
                  <label className="ad-label" htmlFor="bf-video-url">OR ENTER YOUTUBE URL DIRECTLY</label>
                  <input
                    id="bf-video-url"
                    name="videoUrl"
                    type="url"
                    className="ad-in"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={videoUrl}
                    onChange={(e) => { setVideoUrl(e.target.value); setDirty(true); }}
                  />
                  <span className="help">
                    Paste any YouTube video or trailer link. When saved, visitors can watch this trailer before opening the book.
                  </span>
                </div>

                {/* Live Preview Card */}
                {parseYouTubeId(videoUrl) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 14,
                    background: 'rgba(201,168,96,.08)',
                    border: '1px solid rgba(201,168,96,.3)',
                    borderRadius: 6
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${parseYouTubeId(videoUrl)}/mqdefault.jpg`}
                      alt="Trailer thumbnail"
                      style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.5)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {videos.find(v => v.youtubeId === parseYouTubeId(videoUrl))?.title || `${book.title || 'Book'} Trailer`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                        Active on public book page
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ad-sm"
                      style={{ height: 32, fontSize: 12 }}
                      onClick={() => { setVideoUrl(''); setDirty(true); }}
                    >
                      Clear
                    </button>
                  </div>
                )}
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
                  <ImagePick name="cover" current={book.cover} label="Upload a cover" aspect="2 / 3" removeName="removeCover" sizeHint="Recommended: 1600 × 2400" />
                </div>
                <span className="help" style={{ fontSize: 13, color: '#6e6457', lineHeight: 1.5 }}>JPG or PNG, at least 1600 px tall. Without a cover the book shows as a cloth hardback in this color:</span>
                <input type="color" name="clothColor" defaultValue={book.clothColor} aria-label="Cloth cover color" style={{ width: 64, height: 36, border: '1px solid #3a332b', background: 'none' }} />
              </section>
              <section className="ad-card">
                <h2>Banner image</h2>
                <p className="sub">Optional. Used behind the book on its page and in the homepage banner.</p>
                <ImagePick name="banner" current={book.banner} label="Upload a banner" aspect="16 / 9" removeName="removeBanner" sizeHint="Recommended: 1600 × 900" />
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

      {/* ── Reviews section lives OUTSIDE the main form to avoid nesting ── */}
      {ReviewsCard}
    </div>
  );
}
