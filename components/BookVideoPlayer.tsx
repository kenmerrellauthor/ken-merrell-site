'use client';

import { useState } from 'react';
import { Play } from './icons';

export default function BookVideoPlayer({
  videoId,
  title,
  thumbnail,
}: {
  videoId: string;
  title: string;
  thumbnail?: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  const thumbUrl = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  return (
    <div className="book-video-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="book-video-cover-btn"
          onClick={() => setPlaying(true)}
          aria-label={`Play trailer: ${title}`}
        >
          {thumbUrl && (
            <div
              className="book-video-thumb-img abs"
              style={{
                backgroundImage: `url(${thumbUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
          <div className="abs" style={{ background: 'radial-gradient(ellipse at center, rgba(15,13,11,.15) 0%, rgba(15,13,11,.75) 100%)' }} />
          <div className="km-vignette abs" />
          <div className="vplay big" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
            <div className="core">
              <Play s={32} />
            </div>
          </div>
          <div className="book-video-cover-label" style={{
            position: 'absolute',
            left: 20,
            bottom: 20,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none'
          }}>
            <span style={{
              fontFamily: 'var(--serif-c)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.22em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              background: 'rgba(15,13,11,.88)',
              padding: '6px 14px',
              borderRadius: 3,
              border: '1px solid rgba(201,168,96,.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,.6)'
            }}>
              WATCH OFFICIAL TRAILER
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
