'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import mammoth from 'mammoth';
import { checkCredentials, createSession, destroySession, requireAdmin } from '@/lib/auth';
import { isSpam } from '@/lib/spam';
import {
  deleteBook, deleteReader, deleteVideo, getBook, getBooks, getSite, getVideos, newId,
  saveBook, saveBookOrder, saveSite, saveVideo, saveVideoOrder, uploadImage
} from '@/lib/store';
import type { Book, HomeQuote, Quote, Video, VideoType } from '@/lib/types';
import { parseYouTubeId } from '@/lib/youtube';

export type AdminState = { ok?: boolean; error?: string; fields?: Record<string, string>; id?: string };

const refresh = () => revalidatePath('/', 'layout');
const str = (f: FormData, k: string, max = 20000) => String(f.get(k) ?? '').trim().slice(0, max);
const file = (f: FormData, k: string) => {
  const v = f.get(k);
  return v instanceof File && v.size > 0 ? v : null;
};
const slugify = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'book';

/* ---------------- login ---------------- */
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_p: AdminState, form: FormData): Promise<AdminState> {
  const h = await headers();
  const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return { error: 'Too many tries. Please wait 10 minutes and try again.' };
  const email = str(form, 'email', 200);
  const password = String(form.get('password') ?? '');
  if (process.env.TURNSTILE_SECRET_KEY) {
    form.set('_t', String(Date.now() - 5000));
    if (await isSpam(form, ip)) return { error: 'Please complete the check and try again.', fields: { email } };
  }
  if (!checkCredentials(email, password)) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 10 * 60_000 : 0 });
    return { error: 'That email and password do not match.', fields: { email } };
  }
  attempts.delete(ip);
  await createSession(email);
  redirect('/admin');
}

export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

/* ---------------- books ---------------- */
async function sampleFromFile(f: File): Promise<string> {
  const name = f.name.toLowerCase();
  if (f.size > 8 * 1024 * 1024) throw new Error('The sample file must be under 8 MB.');
  const buf = Buffer.from(await f.arrayBuffer());
  if (name.endsWith('.docx')) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value.replace(/\n{3,}/g, '\n\n').trim();
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) return buf.toString('utf8').trim();
  throw new Error('Upload the sample as a Word (.docx) or text (.txt) file. For a PDF or Google Doc, copy the text and paste it in.');
}

export async function saveBookAction(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const id = str(form, 'id') || newId();
    const existing = await getBook(id);
    const books = await getBooks();
    const title = str(form, 'title', 200);
    if (!title) return { error: 'Please give the book a title.' };
    let slug = slugify(str(form, 'slug', 100) || title);
    if (books.some((b) => b.slug === slug && b.id !== id)) slug = `${slug}-${id.slice(0, 4)}`;

    let quotes: Quote[] = [];
    try {
      quotes = (JSON.parse(str(form, 'quotes', 20000) || '[]') as Quote[])
        .map((q) => ({ text: String(q.text || '').trim().slice(0, 600), source: String(q.source || '').trim().slice(0, 160) }))
        .filter((q) => q.text);
    } catch { /* ignore */ }

    let sample = str(form, 'sample', 200000);
    const sf = file(form, 'sampleFile');
    if (sf) sample = await sampleFromFile(sf);

    let cover = existing?.cover ?? null;
    const cf = file(form, 'cover');
    if (cf) cover = await uploadImage(cf, 'covers');
    if (form.get('removeCover') === 'on') cover = null;
    let banner = existing?.banner ?? null;
    const bf = file(form, 'banner');
    if (bf) banner = await uploadImage(bf, 'banners');
    if (form.get('removeBanner') === 'on') banner = null;

    const hasAudible = form.get('hasAudible') === 'on';
    const book: Book = {
      id,
      slug,
      title,
      displayTitle: str(form, 'displayTitle', 200) || title,
      tagline: str(form, 'tagline', 400),
      description: str(form, 'description', 6000),
      genre: str(form, 'genre', 80),
      status: form.get('status') === 'coming' ? 'coming' : 'available',
      featured: form.get('featured') === 'on',
      isNew: form.get('isNew') === 'on',
      order: existing?.order ?? (books.length ? Math.max(...books.map((b) => b.order)) + 1 : 1),
      cover,
      banner,
      clothColor: /^#[0-9a-f]{6}$/i.test(str(form, 'clothColor')) ? str(form, 'clothColor') : existing?.clothColor || '#1c1712',
      amazonUrl: str(form, 'amazonUrl', 500),
      audibleUrl: hasAudible ? str(form, 'audibleUrl', 500) : '',
      published: str(form, 'published', 60),
      pages: str(form, 'pages', 20),
      formats: str(form, 'formats', 80),
      isbn: str(form, 'isbn', 40),
      quotes,
      chapterTitle: str(form, 'chapterTitle', 120),
      sample,
      releaseDate: str(form, 'releaseDate', 10),
      releaseLabel: str(form, 'releaseLabel', 60),
      updatedAt: new Date().toISOString()
    };
    await saveBook(book);
    refresh();
    return { ok: true, id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong while saving.' };
  }
}

export async function deleteBookAction(form: FormData) {
  await requireAdmin();
  await deleteBook(str(form, 'id'));
  refresh();
  redirect('/admin');
}

export async function toggleBookStatus(form: FormData) {
  await requireAdmin();
  const b = await getBook(str(form, 'id'));
  if (!b) return;
  await saveBook({ ...b, status: b.status === 'available' ? 'coming' : 'available', updatedAt: new Date().toISOString() });
  refresh();
}

export async function moveBook(form: FormData) {
  await requireAdmin();
  const id = str(form, 'id');
  const dir = str(form, 'dir') === 'up' ? -1 : 1;
  const ids = (await getBooks()).map((b) => b.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await saveBookOrder(ids);
  refresh();
}

/* ---------------- videos ---------------- */
async function youtubeTitle(id: string) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { cache: 'no-store' });
    if (!r.ok) return '';
    return String(((await r.json()) as { title?: string }).title || '');
  } catch {
    return '';
  }
}

export async function addVideoAction(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const youtubeId = parseYouTubeId(str(form, 'url', 400));
  if (!youtubeId) return { error: 'That does not look like a YouTube link. Copy the address from the video page and paste it here.' };
  const vids = await getVideos();
  const type = (['Trailer', 'Reading', 'Interview'].includes(str(form, 'type')) ? str(form, 'type') : 'Trailer') as VideoType;
  const title = str(form, 'title', 200) || (await youtubeTitle(youtubeId)) || 'Untitled video';
  // Replace the empty placeholders from the design the first time a real video is added.
  const real = vids.filter((v) => v.youtubeId);
  const placeholders = vids.filter((v) => !v.youtubeId);
  for (const p of placeholders) await deleteVideo(p.id);
  const v: Video = { id: newId(), youtubeId, title, type, duration: str(form, 'duration', 12), order: real.length + 1 };
  await saveVideo(v);
  refresh();
  return { ok: true };
}

export async function updateVideoAction(form: FormData) {
  await requireAdmin();
  const vids = await getVideos();
  const v = vids.find((x) => x.id === str(form, 'id'));
  if (!v) return;
  const type = (['Trailer', 'Reading', 'Interview'].includes(str(form, 'type')) ? str(form, 'type') : v.type) as VideoType;
  await saveVideo({ ...v, title: str(form, 'title', 200) || v.title, type, duration: str(form, 'duration', 12) });
  refresh();
}

export async function deleteVideoAction(form: FormData) {
  await requireAdmin();
  await deleteVideo(str(form, 'id'));
  refresh();
}

export async function moveVideo(form: FormData) {
  await requireAdmin();
  const id = str(form, 'id');
  const dir = str(form, 'dir') === 'up' ? -1 : 1;
  const ids = (await getVideos()).map((v) => v.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await saveVideoOrder(ids);
  refresh();
}

/* ---------------- author & bio ---------------- */
export async function saveSiteAction(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const site = await getSite();
    let photo = site.photo;
    const pf = file(form, 'photo');
    if (pf) photo = await uploadImage(pf, 'author');
    if (form.get('removePhoto') === 'on') photo = null;
    let homeQuotes: HomeQuote[] = site.homeQuotes;
    try {
      homeQuotes = (JSON.parse(str(form, 'homeQuotes', 20000) || '[]') as HomeQuote[])
        .map((q) => ({ text: String(q.text || '').trim().slice(0, 300), sub: String(q.sub || '').trim().slice(0, 200), who: String(q.who || '').trim().slice(0, 100) }))
        .filter((q) => q.text);
    } catch { /* keep */ }
    const notifyEmail = str(form, 'notifyEmail', 200);
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(notifyEmail)) return { error: 'The email for messages and signups does not look right.' };
    await saveSite({
      pullQuote: str(form, 'pullQuote', 300).replace(/^[“"]|[”"]$/g, ''),
      bio: str(form, 'bio', 8000),
      photo,
      amazonAuthorUrl: str(form, 'amazonAuthorUrl', 500),
      youtubeUrl: str(form, 'youtubeUrl', 500),
      notifyEmail,
      homeQuotes
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not save.' };
  }
}

/* ---------------- readers ---------------- */
export async function deleteReaderAction(form: FormData) {
  await requireAdmin();
  await deleteReader(str(form, 'id'));
  revalidatePath('/admin/readers');
}
