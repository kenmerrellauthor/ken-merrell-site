'use client';

import { useState, useTransition } from 'react';
import type { Video } from '@/lib/types';
import { updateVideoAction, deleteVideoAction, moveVideo } from '@/app/admin/actions';
import { Ic } from './AdIcons';
import { ImagePick } from './ImagePick';
import { DeleteButton } from './DeleteButton';

const COLS = '44px 220px minmax(0, 1fr) 140px 90px 170px';

export function VideoRow({ v, index, total }: { v: Video; index: number; total: number }) {
  const [isMoving, startMove] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleMove = (dir: 'up' | 'down') => {
    startMove(async () => {
      const fd = new FormData();
      fd.set('id', v.id);
      fd.set('dir', dir);
      await moveVideo(fd);
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startSaving(async () => {
      await updateVideoAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
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
        paddingTop: 20,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(239,231,214,.08)',
      }}
    >
      <input type="hidden" name="id" value={v.id} />

      {/* 1. Movers */}
      <div className="movers" style={{ paddingTop: 4 }}>
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

      {/* 2. Custom Thumbnail */}
      <div style={{ position: 'relative', width: 220 }}>
        <ImagePick
          name="thumbnail"
          current={v.thumbnail ?? (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg` : null)}
          label="Custom Thumbnail"
          aspect="16 / 9"
          removeName="removeThumbnail"
          sizeHint="Recommended: 1280 × 720"
        />
      </div>

      {/* 3. Title & Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <input
          name="title"
          defaultValue={v.title}
          className="ad-in"
          aria-label="Video title"
          style={{ fontFamily: 'var(--serif-d)', fontSize: 18, fontWeight: 600, height: 44 }}
        />
        <span className="ad-meta">
          {v.youtubeId ? `youtube.com/watch?v=${v.youtubeId}` : 'Custom video'}
          {index === 0 ? ' · Featured large on the homepage' : ''}
        </span>
      </div>

      {/* 4. Type (aligned horizontally with title input) */}
      <div>
        <select
          name="type"
          defaultValue={v.type}
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
          defaultValue={v.duration}
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
        <DeleteButton action={deleteVideoAction} id={v.id} itemName={v.title} title={`Remove ${v.title}`} />
      </div>
    </form>
  );
}
