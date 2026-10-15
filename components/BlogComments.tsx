'use client';

import { useState, useTransition, useId } from 'react';
import type { BlogComment } from '@/lib/types';
import { submitBlogCommentAction } from '@/app/admin/actions';

interface Props {
  blogId: string;
  blogSlug: string;
  initialComments?: BlogComment[];
}

export default function BlogComments({ blogId, blogSlug, initialComments = [] }: Props) {
  const [comments, setComments] = useState<BlogComment[]>(
    initialComments.filter((c) => c.approved !== false)
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const nameId = useId();
  const emailId = useId();
  const contentId = useId();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !content.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your name, email, and your comment.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set('blogIdOrSlug', blogSlug || blogId);
    fd.set('authorName', name.trim());
    fd.set('authorEmail', email.trim());
    fd.set('content', content.trim());

    startTransition(async () => {
      setStatus('idle');
      setErrorMessage('');
      const res = await submitBlogCommentAction({}, fd);

      if (res.ok && res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        setName('');
        setEmail('');
        setContent('');
        setStatus('success');
      } else if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Failed to post comment. Please try again.');
      }
    });
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (n.slice(0, 2) || 'R').toUpperCase();
  };

  return (
    <section
      id="comments"
      aria-label="Reader Comments and Discussion"
      style={{
        marginTop: 64,
        paddingTop: 48,
        borderTop: '1px solid rgba(201, 168, 96, 0.25)',
      }}
    >
      {/* ── Section Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
            READER CONVERSATION
          </span>
          <h3
            style={{
              margin: '4px 0 0',
              fontFamily: 'var(--serif, Georgia, serif)',
              fontSize: 26,
              color: 'var(--cream)',
              fontWeight: 600,
            }}
          >
            Reflections &amp; Discussion {comments.length > 0 && <span style={{ color: 'var(--gold)', fontSize: 20 }}>({comments.length})</span>}
          </h3>
        </div>

        <a
          href="#leave-comment"
          className="btn sec"
          style={{
            fontSize: 11,
            padding: '8px 16px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          ✍ Leave a Comment
        </a>
      </div>

      {/* ── Comment List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 48 }}>
        {comments.length === 0 ? (
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(201, 168, 96, 0.25)',
              borderRadius: 8,
              color: 'var(--muted)',
            }}
          >
            <p style={{ margin: 0, fontFamily: 'var(--serif-d, Georgia, serif)', fontSize: 18, color: 'var(--cream-2)' }}>
              No comments yet.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#a89d88' }}>
              Be the first to share your thoughts, historical theories, or reactions with Ken!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              style={{
                background: 'rgba(25, 21, 17, 0.85)',
                border: '1px solid rgba(239, 231, 214, 0.08)',
                borderRadius: 8,
                padding: '22px 24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {/* Comment Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(201,168,96,0.2) 0%, rgba(20,16,12,0.9) 100%)',
                    border: '1px solid rgba(201,168,96,0.4)',
                    color: 'var(--gold)',
                    fontFamily: 'var(--serif-c, "Cinzel", serif)',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(comment.authorName)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--serif, Georgia, serif)',
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--cream)',
                      }}
                    >
                      {comment.authorName}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 7px',
                        borderRadius: 3,
                        background: 'rgba(201, 168, 96, 0.1)',
                        color: 'var(--gold)',
                        border: '1px solid rgba(201, 168, 96, 0.25)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Verified Reader
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Comment Body */}
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--cream-2, #ded6c7)',
                  whiteSpace: 'pre-line',
                }}
              >
                {comment.content}
              </p>

              {/* Author Reply (if Ken responded) */}
              {comment.authorReply && (
                <div
                  style={{
                    marginTop: 18,
                    marginLeft: 20,
                    padding: '16px 20px',
                    background: 'rgba(201, 168, 96, 0.05)',
                    borderLeft: '3px solid var(--gold)',
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        color: '#120f0d',
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        fontWeight: 800,
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      KM
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Ken Merrell · Author Response
                    </span>
                    {comment.authorReplyAt && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(comment.authorReplyAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#f0e6d6', fontStyle: 'italic' }}>
                    &ldquo;{comment.authorReply}&rdquo;
                  </p>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* ── Leave a Comment Form ── */}
      <div
        id="leave-comment"
        style={{
          background: 'linear-gradient(135deg, rgba(26,22,18,0.95) 0%, rgba(16,13,10,0.98) 100%)',
          border: '1px solid rgba(201, 168, 96, 0.3)',
          borderRadius: 8,
          padding: '32px 28px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
          JOIN THE CONVERSATION
        </span>
        <h4
          style={{
            margin: '4px 0 8px',
            fontFamily: 'var(--serif, Georgia, serif)',
            fontSize: 22,
            color: 'var(--cream)',
          }}
        >
          Leave a Thought or Question
        </h4>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#9e9282' }}>
          Your email address will not be published. Required fields are marked *
        </p>

        {status === 'success' && (
          <div
            className="crm-ok"
            style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 6,
              background: 'rgba(109,191,120,.15)',
              border: '1px solid rgba(109,191,120,.35)',
              color: '#9de0a3',
            }}
          >
            ✓ Thank you! Your reflection has been shared and posted to this article.
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div
            className="crm-err"
            style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 6,
              background: 'rgba(198,91,74,.15)',
              border: '1px solid rgba(198,91,74,.35)',
              color: '#e58a78',
            }}
          >
            ✕ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Honeypot field for bot spam prevention */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label
                htmlFor={nameId}
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  letterSpacing: '0.12em',
                  color: 'var(--gold)',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                YOUR NAME *
              </label>
              <input
                id={nameId}
                name="authorName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="crm-in"
                style={{
                  width: '100%',
                  height: 44,
                  background: 'rgba(10, 8, 6, 0.6)',
                  border: '1px solid rgba(201, 168, 96, 0.25)',
                  borderRadius: 4,
                  color: 'var(--cream)',
                  padding: '0 14px',
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                htmlFor={emailId}
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  letterSpacing: '0.12em',
                  color: 'var(--gold)',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                YOUR EMAIL * (PRIVATE)
              </label>
              <input
                id={emailId}
                name="authorEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="crm-in"
                style={{
                  width: '100%',
                  height: 44,
                  background: 'rgba(10, 8, 6, 0.6)',
                  border: '1px solid rgba(201, 168, 96, 0.25)',
                  borderRadius: 4,
                  color: 'var(--cream)',
                  padding: '0 14px',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={contentId}
              style={{
                display: 'block',
                fontSize: 11,
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                letterSpacing: '0.12em',
                color: 'var(--gold)',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              COMMENT OR REFLECTION *
            </label>
            <textarea
              id={contentId}
              name="content"
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are your thoughts on this story or historical backdrop? Have a question for Ken?"
              className="crm-in"
              style={{
                width: '100%',
                background: 'rgba(10, 8, 6, 0.6)',
                border: '1px solid rgba(201, 168, 96, 0.25)',
                borderRadius: 4,
                color: 'var(--cream)',
                padding: '12px 14px',
                fontSize: 14,
                lineHeight: 1.55,
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="btn pri"
              style={{
                fontSize: 12,
                padding: '12px 28px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'POSTING COMMENT…' : 'POST COMMENT'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
