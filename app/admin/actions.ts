'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import mammoth from 'mammoth';
import {
  checkCredentials,
  checkLoginRateLimit,
  createSession,
  destroySession,
  recordLoginAttempt,
  requireAdmin
} from '@/lib/auth';
import {
  addReader, deleteBook, deleteReader, deleteReview, deleteVideo, getBook, getBooks, getSite, getVideos, newId,
  saveBook, saveBooks, saveBookOrder, saveSite, saveVideo, saveVideoOrder, updateReader, updateReview, uploadImage,
  sanitizeBook
} from '@/lib/store';
import type { Book, HomeQuote, Quote, Video, VideoType } from '@/lib/types';
import { parseYouTubeId } from '@/lib/youtube';
import { formatStylishTitle } from '@/components/Bits';

export type AdminState = { ok?: boolean; error?: string; fields?: Record<string, string>; id?: string; book?: Book };

const cleanUrl = (s: string) => {
  const t = s.trim();
  if (!t || t === '#') return t;
  if (/^(https?:|\/|#)/i.test(t)) return t;
  return `https://${t}`;
};

const refresh = (bookId?: string, bookSlug?: string, oldSlug?: string) => {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/books', 'page');
    revalidatePath('/admin', 'page');
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/books/[id]', 'page');
    if (bookId) revalidatePath(`/admin/books/${bookId}`, 'page');
    if (bookSlug) revalidatePath(`/books/${bookSlug}`, 'page');
    if (oldSlug && oldSlug !== bookSlug) revalidatePath(`/books/${oldSlug}`, 'page');
  } catch {
    /* ignore outside request context */
  }
};
const str = (f: FormData, k: string, max = 20000) => String(f.get(k) ?? '').trim().slice(0, max);
const clampWords = (s: unknown, maxWords: number) => {
  const strVal = typeof s === 'string' ? s : String(s || '');
  const trimmed = strVal.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  let count = 0;
  let idx = 0;
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    count++;
    if (count === maxWords) {
      idx = regex.lastIndex;
      break;
    }
  }
  return trimmed.slice(0, idx).trim();
};
const file = (f: FormData, k: string) => {
  const v = f.get(k);
  return v instanceof File && v.size > 0 ? v : null;
};
const slugify = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'book';

/* ---------------- login ---------------- */
export async function login(_p: AdminState, form: FormData): Promise<AdminState> {
  try {
    const h = await headers();
    const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return { error: `Too many tries. Please wait ${rateLimit.waitMinutes} minutes and try again.` };
    }

    const email = str(form, 'email', 200);
    const password = String(form.get('password') ?? '').slice(0, 200);

    if (!email || !password) {
      return { error: 'Please enter both your email and password.', fields: { email } };
    }

    if (!checkCredentials(email, password)) {
      recordLoginAttempt(ip, false);
      return { error: 'That email and password do not match.', fields: { email } };
    }

    recordLoginAttempt(ip, true);
    await createSession(email);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
    if (msg.includes('NEXT_REDIRECT')) {
      return { ok: true };
    }
    return { error: msg };
  }
}


export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

/* ---------------- books ---------------- */
async function sampleFromFile(f: File): Promise<string> {
  const name = f.name.toLowerCase();
  if (f.size > 4.2 * 1024 * 1024) throw new Error('The sample file must be under 4 MB for upload on Vercel.');
  const buf = Buffer.from(await f.arrayBuffer());
  if (name.endsWith('.docx')) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value.replace(/\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  if (name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default;
    const { text } = await pdfParse(buf);
    return text.replace(/\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) return buf.toString('utf8').trim();
  throw new Error('Upload the sample as a PDF (.pdf), Word (.docx) or text (.txt) file.');
}

export async function saveBookAction(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  let redirectTarget = '';
  try {
    const id = str(form, 'id') || newId();
    const existing = await getBook(id);
    const books = await getBooks();
    const title = str(form, 'title', 200) || 'Untitled Book';
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

    let videoThumbnail = existing?.videoThumbnail ?? null;
    const vf = file(form, 'videoThumbnail');
    if (vf) videoThumbnail = await uploadImage(vf, 'videos');
    if (form.get('removeVideoThumbnail') === 'on') videoThumbnail = null;

    const isNewBook = !existing;

    let displayTitle = str(form, 'displayTitle', 200);
    const cleanDisplay = displayTitle.replace(/[*|_]/g, '').trim().toLowerCase();
    const cleanExisting = (existing?.title || '').trim().toLowerCase();
    const cleanTitle = title.trim().toLowerCase();

    if (!displayTitle || cleanDisplay === 'untitled' || (existing && cleanTitle !== cleanExisting && cleanDisplay === cleanExisting)) {
      displayTitle = formatStylishTitle(title);
    }

    const hasAudible = form.get('hasAudible') === 'on';
    const videoUrl = str(form, 'videoUrl', 300);
    const book: Book = sanitizeBook({
      id,
      slug,
      title,
      displayTitle,
      tagline: clampWords(str(form, 'tagline', 2000), 20),
      description: clampWords(str(form, 'description', 8000), 100),
      genre: str(form, 'genre', 80),
      status: form.get('status') === 'coming' ? 'coming' : 'available',
      featured: isNewBook ? true : form.get('featured') === 'on',
      isNew: isNewBook ? true : form.get('isNew') === 'on',
      order: existing?.order ?? (books.length + 1),
      cover,
      banner,
      videoThumbnail,
      clothColor: /^#[0-9a-f]{6}$/i.test(str(form, 'clothColor')) ? str(form, 'clothColor') : existing?.clothColor || '#1c1712',
      amazonUrl: cleanUrl(str(form, 'amazonUrl', 500)),
      audibleUrl: hasAudible ? cleanUrl(str(form, 'audibleUrl', 500)) : '',
      videoUrl: cleanUrl(videoUrl),
      published: str(form, 'published', 60),
      pages: str(form, 'pages', 20),
      formats: str(form, 'formats', 80),
      isbn: str(form, 'isbn', 40),
      quotes,
      reviews: existing?.reviews ?? [],
      chapterTitle: str(form, 'chapterTitle', 120),
      sample,
      releaseDate: str(form, 'releaseDate', 30),
      releaseLabel: str(form, 'releaseLabel', 60),
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || existing?.updatedAt || new Date().toISOString()
    });
    await saveBook(book);
    refresh(id, slug, existing?.slug);

    return { ok: true, id, book, fields: { slug } };
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
  
  let thumbnail: string | null = null;
  const thFile = file(form, 'thumbnail');
  if (thFile) thumbnail = await uploadImage(thFile, 'videos');
  
  const v: Video = { id: newId(), youtubeId, title, type, duration: str(form, 'duration', 12), order: real.length + 1, thumbnail };
  await saveVideo(v);
  revalidatePath('/admin/videos');
  refresh();
  return { ok: true };
}

export async function updateVideoAction(form: FormData) {
  await requireAdmin();
  try {
    const vids = await getVideos();
    const id = str(form, 'id');
    const v = vids.find((x) => x.id === id);
    if (!v) return { error: 'Video not found.' };
    const type = (['Trailer', 'Reading', 'Interview'].includes(str(form, 'type')) ? str(form, 'type') : v.type) as VideoType;
    let thumbnail = v.thumbnail;
    const thFile = file(form, 'thumbnail');
    if (thFile) thumbnail = await uploadImage(thFile, 'videos');
    if (form.get('removeThumbnail') === 'on') thumbnail = null;
    const updated: Video = {
      ...v,
      title: str(form, 'title', 200) || v.title,
      type,
      duration: str(form, 'duration', 12),
      thumbnail,
    };
    await saveVideo(updated);
    revalidatePath('/admin/videos');
    refresh();
    return { ok: true, video: updated };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update video.' };
  }
}

export async function deleteVideoAction(form: FormData) {
  await requireAdmin();
  await deleteVideo(str(form, 'id'));
  revalidatePath('/admin/videos');
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
  revalidatePath('/admin/videos');
  refresh();
}

/* ---------------- author & bio ---------------- */
export async function markReadersSeenAction() {
  await requireAdmin();
  const site = await getSite();
  await saveSite({ ...site, lastSeenReaders: new Date().toISOString() });
  refresh();
}

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
export async function addReaderAdminAction(_p: AdminState, form: FormData): Promise<AdminState & { reader?: import('@/lib/types').Reader }> {
  await requireAdmin();
  try {
    const name = str(form, 'name', 120);
    const email = str(form, 'email', 200).toLowerCase();
    const format = str(form, 'format', 50) || 'Ebook';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { error: 'Please enter a valid email address.' };
    }
    const r: import('@/lib/types').Reader = {
      id: newId(),
      name: name || email.split('@')[0],
      email,
      format,
      agreed: true,
      createdAt: new Date().toISOString()
    };
    const res = await addReader(r);
    revalidatePath('/admin/readers');
    revalidatePath('/admin');
    return { ok: true, reader: res.reader };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not add reader.' };
  }
}

export async function updateReaderAction(_p: AdminState, form: FormData): Promise<AdminState & { reader?: import('@/lib/types').Reader }> {
  await requireAdmin();
  try {
    const id = str(form, 'id');
    const name = str(form, 'name', 120);
    const email = str(form, 'email', 200).toLowerCase();
    const format = str(form, 'format', 50) || 'Ebook';
    if (!id) return { error: 'Missing reader ID.' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { error: 'Please enter a valid email address.' };
    }
    const updated = await updateReader(id, { name: name || email.split('@')[0], email, format });
    revalidatePath('/admin/readers');
    revalidatePath('/admin');
    return { ok: true, reader: updated };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update reader.' };
  }
}

export async function deleteReaderAction(form: FormData) {
  await requireAdmin();
  await deleteReader(str(form, 'id'));
  revalidatePath('/admin/readers');
  revalidatePath('/admin');
}

export async function sendReaderEmailAction(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const subject = str(form, 'subject', 300);
    const body = str(form, 'body', 20000);
    const recipientsRaw = str(form, 'recipients', 50000);

    if (!subject.trim()) return { error: 'Please enter a subject line.' };
    if (!body.trim()) return { error: 'Please enter a message body.' };
    if (!recipientsRaw.trim()) return { error: 'No recipients selected.' };

    const recipients: string[] = JSON.parse(recipientsRaw);
    if (!Array.isArray(recipients) || recipients.length === 0) return { error: 'No recipients selected.' };

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const valid = recipients.filter((e) => emailRe.test(e));
    if (valid.length === 0) return { error: 'No valid email addresses found.' };

    const { sendMail } = await import('@/lib/email');
    const site = await getSite();

    const bookId = str(form, 'bookId');
    let book = null;
    if (bookId) {
      book = await import('@/lib/store').then((m) => m.getBook(bookId));
    }
    const rawAmazonUrl = str(form, 'amazonUrl', 1000);
    const finalAmazonUrl = cleanUrl(rawAmazonUrl) || (book?.amazonUrl ? cleanUrl(book.amazonUrl) : '');

    const esc = (s: string) => s.replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

    const amazonBox = finalAmazonUrl ? `
<div style="margin:28px 0;padding:22px 24px;background:#fbf8f3;border:1px solid #e5dcce;border-radius:6px;text-align:center">
  <div style="font-size:12px;letter-spacing:.14em;font-weight:700;color:#9b6b28;text-transform:uppercase;margin-bottom:8px">Order Paperback on Amazon</div>
  <p style="font-size:15px;color:#1b1814;margin:0 0 16px 0;line-height:1.5">You can order your official paperback copy directly on Amazon using the link below:</p>
  <a href="${esc(finalAmazonUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1b1814;color:#f8f5ee;padding:12px 26px;text-decoration:none;font-size:13px;letter-spacing:.12em;font-weight:700;border-radius:4px">
    ORDER PAPERBACK ON AMAZON &rarr;
  </a>
  <div style="margin-top:12px;font-size:12px;color:#8a8173">
    Direct link: <a href="${esc(finalAmazonUrl)}" target="_blank" rel="noopener noreferrer" style="color:#8a8173;text-decoration:underline">${esc(finalAmazonUrl)}</a>
  </div>
</div>` : '';

    const htmlBody = `<div style="font-family:Georgia,serif;background:#f3f0ea;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:28px 30px">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.12em;color:#1b1814">KEN MERRELL</div>
<h1 style="font-size:22px;font-weight:600;color:#1b1814;margin:18px 0 18px">${esc(subject)}</h1>
<div style="font-size:16px;line-height:1.75;color:#1b1814;white-space:pre-wrap">${esc(body)}</div>
${amazonBox}
<p style="font-size:12px;color:#8a8173;margin-top:28px;border-top:1px solid #ece6da;padding-top:16px">You are receiving this as an advance reader for Ken Merrell.</p>
</div></div>`;

    let attachments: { filename: string; content: Buffer }[] | undefined;
    if (book) {
      const PDFDocument = (await import('pdfkit')).default;
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.fontSize(22).font('Helvetica-Bold').text(book.title, { align: 'center' });
        if (book.tagline) {
          doc.moveDown(0.5);
          doc.fontSize(12).font('Helvetica-Oblique').text(book.tagline, { align: 'center' });
        }
        doc.moveDown(1.5);
        if (book.chapterTitle) {
          doc.fontSize(15).font('Helvetica-Bold').text(book.chapterTitle, { align: 'left' });
          doc.moveDown(0.8);
        }
        const rawText = book.sample?.trim() || book.description?.trim() || 'Advance reader sample manuscript coming soon.';
        const cleanText = rawText.replace(/\r\n/g, '\n');
        doc.fontSize(11).font('Helvetica').text(cleanText, { align: 'left', lineGap: 4 });
        doc.end();
      });
      attachments = [{ filename: `${book.title.replace(/[^a-z0-9]/gi, '_')}_Sample.pdf`, content: pdfBuffer }];
    }

    const replyToInput = str(form, 'replyTo');
    
    let sent = 0;
    const errors: string[] = [];
    for (const email of valid) {
      const ok = await sendMail({ to: email, subject, html: htmlBody, replyTo: replyToInput || site.notifyEmail || undefined, attachments });
      if (ok) sent++;
      else errors.push(email);
    }

    if (sent === 0) return { error: 'Failed to send. Check your RESEND_API_KEY.' };
    if (errors.length > 0) return { ok: true, error: `Sent to ${sent}/${valid.length}. Failed: ${errors.join(', ')}` };
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not send emails.' };
  }
}

/* ---------------- reviews ---------------- */
export async function approveReviewAction(form: FormData) {
  await requireAdmin();
  const bookId = str(form, 'bookId');
  const reviewId = str(form, 'reviewId');
  const adminComment = str(form, 'adminComment', 1000);
  await updateReview(bookId, reviewId, { approved: true, adminComment: adminComment || undefined });
  refresh();
}

export async function rejectReviewAction(form: FormData) {
  await requireAdmin();
  const bookId = str(form, 'bookId');
  const reviewId = str(form, 'reviewId');
  await updateReview(bookId, reviewId, { approved: false });
  refresh();
}

export async function saveReviewCommentAction(form: FormData) {
  await requireAdmin();
  const bookId = str(form, 'bookId');
  const reviewId = str(form, 'reviewId');
  const adminComment = str(form, 'adminComment', 1000);
  await updateReview(bookId, reviewId, { adminComment: adminComment || undefined });
  refresh();
}

export async function deleteReviewAction(form: FormData) {
  await requireAdmin();
  const bookId = str(form, 'bookId');
  const reviewId = str(form, 'reviewId');
  await deleteReview(bookId, reviewId);
  refresh();
}

export async function addReviewAction(_p: AdminState, form: FormData): Promise<AdminState & { review?: import('@/lib/types').Review }> {
  await requireAdmin();
  try {
    const bookId = str(form, 'bookId');
    const name = str(form, 'name', 120);
    const text = str(form, 'text', 3000);
    const rating = Math.min(5, Math.max(1, parseInt(str(form, 'rating'), 10) || 5));
    const adminComment = str(form, 'adminComment', 1000);

    if (!bookId) return { error: 'Book ID missing.' };
    if (!name) return { error: 'Please enter the reviewer name.' };
    if (!text) return { error: 'Please enter the review text.' };

    const { addReview } = await import('@/lib/store');
    const review: import('@/lib/types').Review = {
      id: newId(),
      name,
      rating,
      text,
      adminComment: adminComment || undefined,
      createdAt: new Date().toISOString(),
      approved: true,
    };
    await addReview(bookId, review);
    refresh();
    // Return the review so the client can append it to local state without a page reload
    return { ok: true, review };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not add review.' };
  }
}

export async function updateReviewContentAction(_p: AdminState, form: FormData): Promise<AdminState & { review?: import('@/lib/types').Review }> {
  await requireAdmin();
  try {
    const bookId = str(form, 'bookId');
    const reviewId = str(form, 'reviewId');
    const name = str(form, 'name', 120);
    const text = str(form, 'text', 3000);
    const rating = Math.min(5, Math.max(1, parseInt(str(form, 'rating'), 10) || 5));
    const adminComment = str(form, 'adminComment', 1000);

    if (!bookId || !reviewId) return { error: 'Missing review or book reference.' };
    if (!name) return { error: 'Please enter a name for the reviewer.' };
    if (!text) return { error: 'Review text cannot be empty.' };

    const patch: Partial<import('@/lib/types').Review> = {
      name,
      rating,
      text,
      adminComment: adminComment || undefined,
    };
    await updateReview(bookId, reviewId, patch);
    refresh();
    const book = await getBook(bookId);
    const updated = book?.reviews?.find((r) => r.id === reviewId);
    return { ok: true, review: updated };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update review.' };
  }
}
