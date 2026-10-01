'use client';

import { useState, useTransition } from 'react';
import { Ic } from './AdIcons';

export function DeleteButton({
  action,
  id,
  title,
  itemName = 'item',
  style,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  title?: string;
  itemName?: string;
  style?: React.CSSProperties;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      await action(fd);
    });
  };

  if (confirming) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="ad-sm danger"
          style={{ height: style?.height ?? 40, padding: '0 10px', fontSize: 12, borderColor: '#c65b4a' }}
          title={`Confirm remove ${itemName}`}
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </button>
        <button
          type="button"
          disabled={isPending}
          className="ad-sm"
          style={{ height: style?.height ?? 40, padding: '0 8px', fontSize: 12 }}
          onClick={() => setConfirming(false)}
          title="Cancel"
        >
          <Ic k="x" s={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="ad-sm icon danger"
      onClick={() => setConfirming(true)}
      aria-label={`Remove ${itemName}`}
      title={title || `Remove ${itemName}`}
      style={style}
    >
      <Ic k="trash" s={16} />
    </button>
  );
}
