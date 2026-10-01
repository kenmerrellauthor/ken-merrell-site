'use client';

import { useState } from 'react';
import { Ic } from './AdIcons';

export function DeleteButton({
  action,
  id,
  title,
  itemName = 'item',
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  title?: string;
  itemName?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <form action={action} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="ad-sm danger"
            style={{ height: 40, padding: '0 10px', fontSize: 12, borderColor: '#c65b4a' }}
            title={`Confirm remove ${itemName}`}
          >
            Delete
          </button>
        </form>
        <button
          type="button"
          className="ad-sm"
          style={{ height: 40, padding: '0 8px', fontSize: 12 }}
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
    >
      <Ic k="trash" s={16} />
    </button>
  );
}
