import AddVideo from '@/components/admin/AddVideo';
import { Ic } from '@/components/admin/AdIcons';
import { ImagePick } from '@/components/admin/ImagePick';
import { getVideos } from '@/lib/store';
import { deleteVideoAction, moveVideo, updateVideoAction } from '../../actions';

const COLS = '44px 240px minmax(0, 1fr) 140px 90px 150px';

export default async function VideosAdmin() {
  const videos = await getVideos();
  return (
    <>
      <div className="ad-top">
        <div>
          <h1>Videos</h1>
          <p>Paste a YouTube link and the title fills in on its own. Videos play right on the site.</p>
        </div>
      </div>
      <AddVideo />
      <div className="ad-table">
        <div className="ad-tr head" style={{ gridTemplateColumns: COLS, minWidth: 900 }}>
          <span>ORDER</span><span>VIDEO</span><span>TITLE</span><span>TYPE</span><span>LENGTH</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {videos.map((v, i) => (
          <div key={v.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, minHeight: 124, minWidth: 900 }}>
            <div className="movers">
              <form action={moveVideo}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={i === 0} aria-label="Move up"><Ic k="caretUp" s={16} /></button></form>
              <form action={moveVideo}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={i === videos.length - 1} aria-label="Move down"><Ic k="caretDown" s={16} /></button></form>
            </div>
            <div style={{ position: 'relative', width: 220, alignSelf: 'start' }}>
              <ImagePick 
                name="thumbnail" 
                current={v.thumbnail ?? (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg` : null)} 
                label="Custom Thumbnail" 
                aspect="16 / 9" 
                removeName="removeThumbnail" 
                sizeHint="Recommended: 1280 × 720"
                formId={`vf-${v.id}`}
              />
            </div>
            <form action={updateVideoAction} id={`vf-${v.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <input type="hidden" name="id" value={v.id} />
              <input name="title" defaultValue={v.title} className="ad-in" aria-label="Video title" style={{ fontFamily: 'var(--serif-d)', fontSize: 20, fontWeight: 600, height: 44 }} />
              <span className="ad-meta">{v.youtubeId ? `youtube.com/watch?v=${v.youtubeId}` : 'Shown until you add your first real video'}{i === 0 ? ' · Featured large on the homepage' : ''}</span>
            </form>
            <select name="type" form={`vf-${v.id}`} defaultValue={v.type} className="ad-in" aria-label="Video type"><option>Trailer</option><option>Reading</option><option>Interview</option></select>
            <input name="duration" form={`vf-${v.id}`} defaultValue={v.duration} className="ad-in" placeholder="0:00" aria-label="Length" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="submit" form={`vf-${v.id}`} className="ad-sm"><Ic k="check" s={15} />Save</button>
              <form action={deleteVideoAction}><input type="hidden" name="id" value={v.id} /><button type="submit" className="ad-sm icon" aria-label={`Remove ${v.title}`}><Ic k="trash" s={16} /></button></form>
            </div>
          </div>
        ))}
      </div>
      <p className="ad-note">The top video is featured large on the homepage, with the next two beside it. Use the arrows to change the order.</p>
    </>
  );
}
