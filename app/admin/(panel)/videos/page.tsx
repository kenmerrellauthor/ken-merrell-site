import AddVideo from '@/components/admin/AddVideo';
import { getVideos } from '@/lib/store';
import { VideoRow } from '@/components/admin/VideoRow';

const COLS = '44px 220px minmax(0, 1fr) 140px 90px 170px';

export default async function VideosAdmin() {
  const videos = await getVideos();
  return (
    <>
      <div className="crm-top">
        <div>
          <h1>Videos</h1>
          <p>Paste a YouTube link and the title fills in on its own. Videos play right on the site.</p>
        </div>
      </div>
      <AddVideo />
      <div className="crm-table">
        <div className="crm-tr head" style={{ gridTemplateColumns: COLS, minWidth: 900 }}>
          <span>ORDER</span><span>VIDEO</span><span>TITLE</span><span>TYPE</span><span>LENGTH</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {videos.map((v, i) => (
          <VideoRow key={v.id} v={v} index={i} total={videos.length} />
        ))}
      </div>
      <p className="crm-note">The top video is featured large on the homepage, with the next two beside it. Use the arrows to change the order.</p>
    </>
  );
}
