'use client';
import { useState, useEffect } from 'react';
import { Ic } from './AdIcons';

export function ImagePick({ name, current, label, aspect, removeName, sizeHint, formId }: { name: string; current: string | null; label: string; aspect: string; removeName: string; sizeHint?: string; formId?: string }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setPreview(current);
    setRemoved(false);
    setErr(null);
  }, [current]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErr(`Selected image is ${(f.size / (1024 * 1024)).toFixed(1)} MB. Please choose an image under 4 MB for Vercel deployment.`);
      e.target.value = '';
      return;
    }
    setErr(null);
    setPreview(URL.createObjectURL(f));
    setRemoved(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {preview && !removed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', boxShadow: '10px 8px 24px rgba(0,0,0,.6)', borderRadius: 4 }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: aspect, border: '1px dashed #4a4137', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6457', fontSize: 13, textAlign: 'center', padding: 12, borderRadius: 4 }}>No image yet</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label className="drop" style={{ position: 'relative', justifyContent: 'center', minHeight: 44 }}>
          <Ic k="up" s={16} />{label}
          <input type="file" name={name} form={formId} accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        </label>
        {err ? (
          <span style={{ fontSize: 12, color: '#f28b7e', textAlign: 'center', fontWeight: 600 }}>{err}</span>
        ) : (
          sizeHint && <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>{sizeHint} (Max: 4 MB)</span>
        )}
      </div>
      {current && (
        <label className="chk" style={{ fontSize: 13 }}><input type="checkbox" name={removeName} form={formId} checked={removed} onChange={(e) => setRemoved(e.target.checked)} />Remove this image</label>
      )}
    </div>
  );
}
