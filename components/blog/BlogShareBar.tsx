'use client';

import React, { useState } from 'react';

interface Props {
  title: string;
  slug: string;
  excerpt?: string;
  variant?: 'inline' | 'card';
}

export default function BlogShareBar({ title, slug, excerpt = '', variant = 'inline' }: Props) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Derive absolute article URL safely on client or fallback to canonical
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.kenmerrell.com';
  const articleUrl = `${origin}/blog/${slug}`;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedExcerpt = encodeURIComponent(excerpt.slice(0, 160));

  const shareLinks = [
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: '#ffffff',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: '#1877f2',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: '#0077b5',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: '#25d366',
    },
    {
      id: 'email',
      name: 'Email',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      url: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0ARead%20article:%20${encodedUrl}`,
      color: 'var(--cream)',
    },
  ];

  const handleShareClick = (e: React.MouseEvent<HTMLAnchorElement>, item: (typeof shareLinks)[0]) => {
    if (item.id === 'email') return; // mailto works natively

    e.preventDefault();
    const liveUrl = (typeof window !== 'undefined' && window.location.href) ? window.location.href : articleUrl;
    const encUrl = encodeURIComponent(liveUrl);
    const encTitle = encodeURIComponent(title);

    let target = item.url;
    if (item.id === 'x') {
      target = `https://x.com/intent/tweet?text=${encTitle}&url=${encUrl}`;
    } else if (item.id === 'facebook') {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
    } else if (item.id === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
    } else if (item.id === 'whatsapp') {
      target = `https://wa.me/?text=${encTitle}%20${encUrl}`;
    }

    window.open(target, '_blank', 'noopener,noreferrer,width=620,height=540');
  };

  const handleCopyLink = async () => {
    try {
      const liveUrl = (typeof window !== 'undefined' && window.location.href) ? window.location.href : articleUrl;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(liveUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = liveUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    const liveUrl = (typeof window !== 'undefined' && window.location.href) ? window.location.href : articleUrl;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: liveUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  if (variant === 'card') {
    return (
      <aside
        aria-label="Share this story"
        style={{
          marginTop: 48,
          marginBottom: 16,
          padding: '28px 24px',
          background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.95) 0%, rgba(14, 12, 10, 0.98) 100%)',
          border: '1px solid rgba(201, 168, 96, 0.3)',
          borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative gold corner notches */}
        <span style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', bottom: 3, left: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold, #c9a860)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Spread the Frontier Record
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(18px, 1.8vw, 22px)',
                color: 'var(--cream, #fdfbf7)',
                lineHeight: 1.3,
              }}
            >
              Enjoyed this article? Share it with fellow readers
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {shareLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                onClick={(e) => handleShareClick(e, item)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Share on ${item.name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(201, 168, 96, 0.25)',
                  color: 'var(--cream, #fdfbf7)',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201, 168, 96, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 96, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: 11, letterSpacing: '0.04em' }}>{item.name}</span>
              </a>
            ))}

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy article link to clipboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 15px',
                borderRadius: 4,
                background: copied ? 'var(--gold, #c9a860)' : 'rgba(201, 168, 96, 0.12)',
                border: '1px solid var(--gold, #c9a860)',
                color: copied ? '#15120f' : 'var(--gold, #c9a860)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {copied ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
              <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Inline Variant (e.g. Under Article Header / Byline)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '12px 0',
      }}
      aria-label="Share article toolbar"
    >
      <span
        style={{
          fontFamily: 'var(--serif-c, "Cinzel", serif)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--gold, #c9a860)',
          fontWeight: 700,
          marginRight: 4,
        }}
      >
        SHARE:
      </span>

      {shareLinks.map((item) => (
        <a
          key={item.name}
          href={item.url}
          onClick={(e) => handleShareClick(e, item)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${item.name}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(201, 168, 96, 0.25)',
            color: 'var(--cream, #fdfbf7)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201, 168, 96, 0.2)';
            e.currentTarget.style.borderColor = 'var(--gold)';
            e.currentTarget.style.color = 'var(--gold)';
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(201, 168, 96, 0.25)';
            e.currentTarget.style.color = 'var(--cream, #fdfbf7)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          {item.icon}
        </a>
      ))}

      {/* Copy Link Pill */}
      <button
        type="button"
        onClick={handleCopyLink}
        title="Copy article link to clipboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 16,
          background: copied ? 'var(--gold, #c9a860)' : 'rgba(201, 168, 96, 0.1)',
          border: '1px solid var(--gold, #c9a860)',
          color: copied ? '#15120f' : 'var(--gold, #c9a860)',
          fontSize: 10.5,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
      </button>

      {/* Mobile Native Share Button if supported */}
      {mounted && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          type="button"
          onClick={handleNativeShare}
          title="Share via device options"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--cream)',
            fontSize: 10.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>MORE</span>
        </button>
      )}
    </div>
  );
}
