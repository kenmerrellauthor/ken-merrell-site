'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addVideoAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';

import { ImagePick } from './ImagePick';

function Btn() {
  const { pending } = useFormStatus();
  return <button type="submit" className="ad-btn pri" style={{ height: 48, alignSelf: 'end' }} disabled={pending}><Ic k="plus" s={16} sw={1.8} />{pending ? 'ADDING…' : 'ADD VIDEO'}</button>;
}

export default function AddVideo() {
  const [state, action] = useActionState<AdminState, FormData>(addVideoAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="ad-card">
      <h2>Add a video</h2>
      {state.error && <div className="ad-err" role="alert">{state.error}</div>}
      {state.ok && <div className="ad-ok" role="status"><Ic k="check" s={16} sw={2} />Video added. It is live on the homepage.</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        <div>
          <ImagePick 
            name="thumbnail" 
            current={null} 
            label="Custom Thumbnail" 
            aspect="16 / 9" 
            removeName="removeThumbnail" 
            sizeHint="Optional: 1280 × 720" 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ad-field">
            <label className="ad-label" htmlFor="v-url">YOUTUBE LINK</label>
            <input id="v-url" name="url" className="ad-in" placeholder="https://www.youtube.com/watch?v=…" required />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end' }}>
            <div className="ad-field">
              <label className="ad-label" htmlFor="v-type">TYPE</label>
              <select id="v-type" name="type" className="ad-in"><option>Trailer</option><option>Reading</option><option>Interview</option></select>
            </div>
            <div className="ad-field">
              <label className="ad-label" htmlFor="v-dur">LENGTH</label>
              <input id="v-dur" name="duration" className="ad-in" placeholder="3:42" />
            </div>
            <Btn />
          </div>
          <p className="ad-note" style={{ margin: 0 }}>The title and default thumbnail fill in from YouTube. You can change them below after adding.</p>
        </div>
      </div>
    </form>
  );
}
