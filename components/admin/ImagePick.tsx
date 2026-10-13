'use client';
import { useState, useEffect, useRef } from 'react';
import { Ic } from './AdIcons';

async function svgToPng(file: File): Promise<File> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = sourceUrl;
    await image.decode();

    const sourceWidth = image.naturalWidth || 1024;
    const sourceHeight = image.naturalHeight || 1024;
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this SVG image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not convert this SVG to PNG.')), 'image/png');
    });
    const baseName = file.name.replace(/\.svg$/i, '') || 'uploaded-image';
    return new File([png], `${baseName}.png`, { type: 'image/png', lastModified: file.lastModified });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function ImagePick({ name, current, label, aspect, removeName, sizeHint, formId }: { name: string; current: string | null; label: string; aspect: string; removeName: string; sizeHint?: string; formId?: string }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const convertingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const blockSubmitDuringConversion = (event: SubmitEvent) => {
      if (!convertingRef.current) return;
      event.preventDefault();
      setErr('Please wait for the SVG conversion to finish, then save again.');
    };
    form.addEventListener('submit', blockSubmitDuringConversion);
    return () => form.removeEventListener('submit', blockSubmitDuringConversion);
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  useEffect(() => {
    setPreview(current);
    setRemoved(false);
    setErr(null);
  }, [current]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErr(`Selected image is ${(f.size / (1024 * 1024)).toFixed(1)} MB. Please choose an image under 4 MB for Vercel deployment.`);
      input.value = '';
      return;
    }
    try {
      setErr(null);
      const isSvg = f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg');
      convertingRef.current = isSvg;
      setConverting(isSvg);
      const imageFile = isSvg
        ? await svgToPng(f)
        : f;
      if (imageFile.size > 4 * 1024 * 1024) {
        throw new Error('The converted image is over 4 MB. Try a smaller SVG.');
      }
      if (imageFile !== f) {
        const transfer = new DataTransfer();
        transfer.items.add(imageFile);
        input.files = transfer.files;
      }
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(imageFile);
      previewUrlRef.current = previewUrl;
      setPreview(previewUrl);
      setRemoved(false);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not prepare this image. Try exporting it as PNG.');
      input.value = '';
    } finally {
      convertingRef.current = false;
      setConverting(false);
    }
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
          <input ref={inputRef} type="file" name={name} form={formId} accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" onChange={handleFileChange} disabled={converting} />
        </label>
        {err ? (
          <span style={{ fontSize: 12, color: '#f28b7e', textAlign: 'center', fontWeight: 600 }}>{err}</span>
        ) : converting ? (
          <span role="status" style={{ fontSize: 12, color: 'var(--gold)', textAlign: 'center' }}>Converting SVG to PNG…</span>
        ) : (
          sizeHint && <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>{sizeHint} (Max: 4 MB). SVG files convert to PNG automatically.</span>
        )}
      </div>
      {current && (
        <label className="chk" style={{ fontSize: 13 }}><input type="checkbox" name={removeName} form={formId} checked={removed} onChange={(e) => setRemoved(e.target.checked)} />Remove this image</label>
      )}
    </div>
  );
}
