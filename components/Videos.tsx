'use client';
import { useState } from 'react';
import type { Video } from '@/lib/types';
import { Play } from './icons';

const thumb = (v: Video, fallback: string) =>
  v.thumbnail
    ? `url(${v.thumbnail})`
    : v.youtubeId
    ? `url(https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg)`
    : fallback;

function Card({ v, featured, fallback }: { v: Video; featured?: boolean; fallback: string }) {
  const [playing, setPlaying] = useState(false);
  const playable = !!v.youtubeId;
  const inner = (
    <>
      <div className="vthumb" style={{ backgroundImage: playing ? undefined : thumb(v, fallback) }}>
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {!v.youtubeId && fallback.includes('linen') && <div className="abs" style={{ inset: 10, border: '1px solid rgba(201,168,96,.25)' }} />}
            <div className="abs" style={{ background: featured ? 'rgba(15,13,11,.25)' : 'rgba(15,13,11,.35)' }} />
            {featured && <div className="km-vignette abs" />}
            {featured ? (
              <div className="vplay big"><div className="core"><Play s={28} /></div></div>
            ) : (
              <div className="vplay"><Play /></div>
            )}
            {featured && <div className="vtag">FEATURED</div>}
            {v.duration && <div className="vdur">{v.duration}</div>}
          </>
        )}
      </div>
      {!(playing && !featured) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="vt">{v.title}</span>
          {featured && <span className="vs">{v.type}</span>}
        </div>
      )}
    </>
  );
  if (playing || !playable) return <div className={`vcard${featured ? ' feat' : ''}`} style={{ cursor: 'default' }}>{inner}</div>;
  return (
    <button type="button" className={`vcard${featured ? ' feat' : ''}`} onClick={() => setPlaying(true)} aria-label={`Play video: ${v.title}`}>
      {inner}
    </button>
  );
}

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const display = videos.slice(0, 3);
  const [first, ...rest] = display;
  if (!first) return null;
  const fb = ['url(/img/banners/traitor.jpg)', 'url(/img/banners/ash.jpg)', 'url(/img/textures/linen.png)', 'url(/img/banners/craven.jpg)'];
  return (
    <div className="video-grid">
      <Card v={first} featured fallback={fb[0]} />
      {rest.length > 0 && (
        <div className="video-side">
          {rest.slice(0, 2).map((v, k) => <Card key={v.id} v={v} fallback={fb[(k + 1) % fb.length]} />)}
        </div>
      )}
    </div>
  );
}
