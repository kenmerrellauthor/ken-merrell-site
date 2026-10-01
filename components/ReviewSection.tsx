'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReview, type FormState } from '@/app/actions';
import type { Review } from '@/lib/types';
import Turnstile, { Traps } from './Turnstile';
import { Arrow, Check, Warn } from './icons';

const initial: FormState = { ok: false, errors: {} };

function Stars({ n, size = 18 }: { n: number; size?: number }) {
  return (
    <span className="rv-stars" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <svg key={k} width={size} height={size} viewBox="0 0 24 24" fill={k <= n ? '#c9a860' : 'none'} stroke={k <= n ? '#c9a860' : '#4a4137'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({ value }: { value?: number }) {
  return (
    <fieldset className="rv-star-pick" style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="rv-label">YOUR RATING</legend>
      <div className="rv-stars-row">
        {[5, 4, 3, 2, 1].map((n) => (
          <label key={n} className="rv-star-lbl" title={`${n} star${n > 1 ? 's' : ''}`}>
            <input type="radio" name="rating" value={n} defaultChecked={value ? value === n : n === 5} />
            <svg width="28" height="28" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-gold rv-submit" disabled={pending} aria-busy={pending}>
      {pending ? 'POSTING\u2026' : <>POST REVIEW <Arrow /></>}
    </button>
  );
}

function Err({ text }: { text?: string }) {
  if (!text) return null;
  return <span className="rv-err"><Warn /> {text}</span>;
}

function ReviewForm({ bookId }: { bookId: string }) {
  const [state, action] = useActionState(submitReview, initial);
  const v = state.values || {};

  if (state.ok) {
    return (
      <div className="rv-thanks" aria-live="polite">
        <span className="rv-tick"><Check /></span>
        <div>
          <h4>Thanks{state.name ? `, ${state.name}` : ''}!</h4>
          <p>Your review has been submitted and will appear after approval.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="rv-form" noValidate>
      <input type="hidden" name="bookId" value={bookId} />
      <Traps />
      <Turnstile theme="dark" />
      {state.message && <div className="rv-alert" role="alert"><Warn /> {state.message}</div>}
      <div className="rv-row2">
        <div className="rv-field">
          <label htmlFor="rv-name" className="rv-label">YOUR NAME</label>
          <input id="rv-name" name="name" className="rv-in" placeholder="Jane Smith" defaultValue={v.name} autoComplete="name" required />
          <Err text={state.errors?.name} />
        </div>
        <StarPicker value={v.rating ? Number(v.rating) : undefined} />
      </div>
      <div className="rv-field">
        <label htmlFor="rv-text" className="rv-label">YOUR REVIEW</label>
        <textarea id="rv-text" name="text" className="rv-ta" placeholder="Share your thoughts about this book\u2026" defaultValue={v.text} rows={4} required />
        <Err text={state.errors?.text} />
      </div>
      <SubmitBtn />
    </form>
  );
}

interface ReviewSectionProps {
  bookId: string;
  reviews: Review[];
}

export default function ReviewSection({ bookId, reviews }: ReviewSectionProps) {
  const approved = reviews.filter((r) => r.approved);
  const avg = approved.length
    ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
    : null;

  return (
    <section id="reviews" className="rv-section">
      <div className="rv-inner">
        <div className="rv-head">
          <div className="rv-title-row">
            <div className="eyebrow dark">
              <span className="line" />
              <span className="txt">READER REVIEWS</span>
              <span className="line" />
            </div>
            <h2 className="rv-h2">
              What readers <em>are saying</em>
            </h2>
          </div>
          {avg !== null && (
            <div className="rv-avg">
              <span className="rv-avg-num">{avg}</span>
              <Stars n={Math.round(avg)} size={22} />
              <span className="rv-avg-sub">{approved.length} review{approved.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {approved.length > 0 ? (
          <div className="rv-grid">
            {approved.map((r) => (
              <article key={r.id} className="rv-card">
                <Stars n={r.rating} />
                <blockquote className="rv-text">&ldquo;{r.text}&rdquo;</blockquote>
                <footer className="rv-footer">
                  <span className="rv-name">{r.name}</span>
                  <span className="rv-date">{r.createdAt && !isNaN(new Date(r.createdAt).getTime()) ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent'}</span>
                </footer>
                {r.adminComment && (
                  <div className="rv-comment">
                    <span className="rv-comment-lbl">Ken&rsquo;s note:</span>
                    <p>{r.adminComment}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="rv-empty">Be the first to leave a review for this book!</p>
        )}

        <div className="rv-write">
          <h3 className="rv-write-h">Leave a review</h3>
          <ReviewForm bookId={bookId} />
        </div>
      </div>
    </section>
  );
}
