'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Video, VideoType } from '@/lib/types';
import { updateVideoAction, deleteVideoAction, moveVideo } from '@/app/admin/actions';
import { Ic } from './AdIcons';
import { ImagePick } from './ImagePick';
import { DeleteButton } from './DeleteButton';

const COLS = '44px 220px minmax(0, 1fr) 140px 90px 170px';

export function VideoRow({ v, index, total }: { v: Video; index: number; total: number }) {
  const router = useRouter();
  const [video, setVideo] = useState(v);
  const [title, setTitle] = useState(v.title);
  const [type, setType] = useState(v.type);
  const [duration, setDuration] = useState(v.duration);
  const [isMoving, startMove] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVideo(v);
    setTitle(v.title);
    setType(v.type);
    setDuration(v.duration);
  }, [v]);

  const handleMove = (dir: 'up' | 'down') => {
    startMove(async () => {
      const fd = new FormData();
      fd.set('id', video.id);
      fd.set('dir', dir);
      await moveVideo(fd);
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startSaving(async () => {
      try {
        const res = await updateVideoAction(fd);
        if (res?.error) {
          setError(res.error);
        } else if (res?.video) {
          setVideo(res.video);
          setTitle(res.video.title);
          setType(res.video.type);
          setDuration(res.video.duration);
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 2500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save changes');
      }
    });
  };

  return (
    <form
      onSubmit={handleSave}
      encType="multipart/form-data"
      className="ad-tr row"
      style={{
        gridTemplateColumns: COLS,
        minWidth: 900,
        alignItems: 'start',
        paddingTop: 18,
        paddingBottom: 18,
        borderBottom: '1px solid rgba(239,231,214,.08)',
      }}
    >
      <input type="hidden" name="id" value={video.id} />

      {/* 1. Movers */}
      <div className="movers" style={{ height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <button
          type="button"
          disabled={index === 0 || isMoving}
          onClick={() => handleMove('up')}
          aria-label="Move up"
        >
          <Ic k="caretUp" s={16} />
        </button>
        <button
          type="button"
          disabled={index === total - 1 || isMoving}
          onClick={() => handleMove('down')}
          aria-label="Move down"
        >
          <Ic k="caretDown" s={16} />
        </button>
      </div>

      {/* 2. Custom Thumbnail for already uploaded video */}
      <div style={{ position: 'relative', width: 220 }}>
        <ImagePick
          name="thumbnail"
          current={video.thumbnail ?? (video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg` : null)}
          label="Custom Thumbnail"
          aspect="16 / 9"
          removeName="removeThumbnail"
          sizeHint="Recommended: 1280 × 720"
        />
      </div>

      {/* 3. Title & Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ad-in"
          aria-label="Video title"
          style={{ fontFamily: 'var(--serif-d)', fontSize: 18, fontWeight: 600, height: 44 }}
        />
        <span className="ad-meta">
          {video.youtubeId ? `youtube.com/watch?v=${video.youtubeId}` : 'Custom video'}
          {index === 0 ? ' · Featured large on the homepage' : ''}
        </span>
        {error && <span style={{ color: '#e58a78', fontSize: 12 }}>{error}</span>}
      </div>

      {/* 4. Type (aligned horizontally with title input) */}
      <div>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as VideoType)}
          className="ad-in"
          style={{ height: 44 }}
          aria-label="Video type"
        >
          <option>Trailer</option>
          <option>Reading</option>
          <option>Interview</option>
        </select>
      </div>

      {/* 5. Length (aligned horizontally with title input) */}
      <div>
        <input
          name="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="ad-in"
          style={{ height: 44 }}
          placeholder="0:00"
          aria-label="Length"
        />
      </div>

      {/* 6. Actions (aligned horizontally with title input) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: 44 }}>
        <button
          type="submit"
          disabled={isSaving}
          className="ad-sm"
          style={{
            height: 44,
            borderColor: saved ? 'var(--gold)' : undefined,
            color: saved ? 'var(--gold)' : undefined,
          }}
          title="Save changes"
        >
          <Ic k="check" s={15} />
          {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
        <DeleteButton
          action={deleteVideoAction}
          id={video.id}
          itemName={video.title}
          title={`Remove ${video.title}`}
          style={{ height: 44, width: 44 }}
        />
      </div>
    </form>
  );
}
