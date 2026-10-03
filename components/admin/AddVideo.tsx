'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addVideoAction, type AdminState } from '@/app/admin/actions';
import { Ic } from './AdIcons';

function Btn() {
  const { pending } = useFormStatus();
  return <button type="submit" className="crm-btn pri" style={{ height: 48, alignSelf: 'end' }} disabled={pending}><Ic k="plus" s={16} sw={1.8} />{pending ? 'ADDING…' : 'ADD VIDEO'}</button>;
}

export default function AddVideo() {
  const [state, action] = useActionState<AdminState, FormData>(addVideoAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="crm-card">
      <h2>Add a video</h2>
      {state.error && <div className="crm-err" role="alert">{state.error}</div>}
      {state.ok && <div className="crm-ok" role="status"><Ic k="check" s={16} sw={2} />Video added. It is live on the homepage.</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 180px 110px auto', gap: 14, alignItems: 'end' }} className="crm-vgrid">
        <div className="crm-field">
          <label className="crm-label" htmlFor="v-url">YOUTUBE LINK</label>
          <input id="v-url" name="url" className="crm-in" placeholder="https://www.youtube.com/watch?v=…" required />
        </div>
        <div className="crm-field">
          <label className="crm-label" htmlFor="v-type">TYPE</label>
          <select id="v-type" name="type" className="crm-in"><option>Trailer</option><option>Reading</option><option>Interview</option></select>
        </div>
        <div className="crm-field">
          <label className="crm-label" htmlFor="v-dur">LENGTH</label>
          <input id="v-dur" name="duration" className="crm-in" placeholder="3:42" />
        </div>
        <Btn />
      </div>
      <p className="crm-note" style={{ margin: 0 }}>The title and default thumbnail fill in from YouTube automatically. You can customize the thumbnail, title, type, and length below for any uploaded video.</p>
    </form>
  );
}
