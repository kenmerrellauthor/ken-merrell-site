import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Book, CrmNotification, Reader, Review, SiteSettings, Video } from './types';
import { seedBooks, seedSite, seedVideos } from './seed';

/*
 * One small storage layer with two backends:
 *  - Supabase (production): set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Tables are in supabase/schema.sql.
 *  - Local JSON files in /data (development, or a server with a writable disk).
 * Every table stores one JSON document per row, so adding a field never needs a migration.
 */

type Table = 'books' | 'videos' | 'readers' | 'settings';

let sb: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!sb) {
    sb = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return sb;
}

export const usingSupabase = () => !!supabase();

const DATA_DIR = path.join(process.cwd(), 'data');
const seeds: Record<Table, { id: string }[]> = {
  books: seedBooks,
  videos: seedVideos,
  readers: [],
  settings: [{ id: 'site', ...seedSite }]
};

async function readLocal<T>(table: Table): Promise<T[]> {
  const file = path.join(DATA_DIR, `${table}.json`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T[];
  } catch {
    const seed = seeds[table] as unknown as T[];
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(file, JSON.stringify(seed, null, 2));
    } catch {
      /* read-only disk: serve the seed */
    }
    return seed;
  }
}

async function writeLocal<T>(table: Table, rows: T[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      throw new Error('This server cannot save changes to disk. Add the Supabase keys (see README) so the admin panel can save.');
    }
    throw e;
  }
}

async function all<T extends { id: string }>(table: Table): Promise<T[]> {
  const db = supabase();
  if (!db) return readLocal<T>(table);
  const { data, error } = await db.from(table).select('id, data');
  if (error) throw new Error(`Supabase read ${table}: ${error.message}`);
  const rows = data ?? [];
  if (!rows.length && seeds[table].length) {
    await db.from(table).insert(seeds[table].map((r) => ({ id: r.id, data: r })));
    return seeds[table] as unknown as T[];
  }
  return rows.map((r) => r.data as T);
}


async function upsert<T extends { id: string }>(table: Table, row: T) {
  const db = supabase();
  if (!db) {
    const rows = await readLocal<T>(table);
    const i = rows.findIndex((r) => r.id === row.id);
    if (i >= 0) rows[i] = row;
    else rows.push(row);
    return writeLocal(table, rows);
  }
  const { error } = await db.from(table).upsert({ id: row.id, data: row });
  if (error) throw new Error(`Supabase write ${table}: ${error.message}`);
}

async function upsertMany<T extends { id: string }>(table: Table, rows: T[]) {
  const db = supabase();
  if (!db) {
    const cur = await readLocal<T>(table);
    const map = new Map(cur.map((r) => [r.id, r]));
    rows.forEach((r) => map.set(r.id, r));
    return writeLocal(table, [...map.values()]);
  }
  const { error } = await db.from(table).upsert(rows.map((r) => ({ id: r.id, data: r })));
  if (error) throw new Error(`Supabase write ${table}: ${error.message}`);
}

async function remove(table: Table, id: string) {
  const db = supabase();
  if (!db) {
    const rows = await readLocal<{ id: string }>(table);
    return writeLocal(table, rows.filter((r) => r.id !== id));
  }
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) throw new Error(`Supabase delete ${table}: ${error.message}`);
}

export const newId = () => crypto.randomBytes(6).toString('hex');

/** Returns true if the book has isNew enabled in admin, or was uploaded within the last 3 days if not explicitly set. */
export function isBookNew(book: Book): boolean {
  if (typeof book.isNew === 'boolean') return book.isNew;
  const dateStr = book.createdAt || book.updatedAt;
  if (!dateStr) return false;
  const uploadedTime = new Date(dateStr).getTime();
  if (isNaN(uploadedTime)) return false;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - uploadedTime <= THREE_DAYS_MS;
}

export function sanitizeBook(b: Partial<Book> & { id: string }): Book {
  // If a 'coming' book has reached or passed its release date/time, automatically shift to 'available'
  let status: 'available' | 'coming' = b.status === 'coming' ? 'coming' : 'available';
  let isNew = Boolean(b.isNew);

  if (status === 'coming' && b.releaseDate) {
    const raw = b.releaseDate.trim();
    const dateStr = raw.length === 10 ? `${raw}T00:00:00` : raw;
    const releaseTime = new Date(dateStr).getTime();
    if (!Number.isNaN(releaseTime) && releaseTime <= Date.now()) {
      status = 'available';
      isNew = true; // Mark newly shifted book as NEW on the normal bookshelf
    }
  }

  return {
    id: b.id,
    slug: b.slug || b.id,
    title: b.title || 'Untitled',
    displayTitle: b.displayTitle || b.title || 'Untitled',
    tagline: b.tagline || '',
    description: b.description || '',
    genre: b.genre || 'A novel',
    status,
    featured: Boolean(b.featured),
    isNew,
    order: typeof b.order === 'number' ? b.order : 1,
    cover: b.cover ?? null,
    banner: b.banner ?? null,
    clothColor: b.clothColor || '#1c1712',
    amazonUrl: b.amazonUrl || '',
    audibleUrl: b.audibleUrl || '',
    videoUrl: b.videoUrl || '',
    videoThumbnail: b.videoThumbnail ?? null,
    published: b.published || (status === 'available' && b.releaseLabel ? b.releaseLabel : ''),
    pages: b.pages || '',
    formats: b.formats || 'Print, Ebook',
    isbn: b.isbn || '',
    quotes: Array.isArray(b.quotes) ? b.quotes : [],
    reviews: Array.isArray(b.reviews) ? b.reviews : [],
    chapterTitle: b.chapterTitle || '',
    sample: typeof b.sample === 'string' ? b.sample : '',
    releaseDate: b.releaseDate || '',
    releaseLabel: b.releaseLabel || '',
    updatedAt: b.updatedAt || new Date().toISOString(),
    createdAt: b.createdAt || b.updatedAt || new Date().toISOString(),
  };
}

/* ---------------- Books ---------------- */
export async function getBooks(): Promise<Book[]> {
  const rows = await all<Book>('books');
  const sanitized = rows.map(sanitizeBook);

  // If any coming soon book had its release date/time pass, persist the updated status
  const expiredComing = rows.filter((r) => r.status === 'coming' && r.releaseDate).filter((r) => {
    const raw = r.releaseDate.trim();
    const dateStr = raw.length === 10 ? `${raw}T00:00:00` : raw;
    const t = new Date(dateStr).getTime();
    return !Number.isNaN(t) && t <= Date.now();
  });

  if (expiredComing.length > 0) {
    Promise.all(
      expiredComing.map((b) =>
        saveBook({
          ...b,
          status: 'available',
          isNew: true,
          published: b.published || b.releaseLabel || '',
          updatedAt: new Date().toISOString()
        })
      )
    ).catch(() => {
      /* ignore background persistence errors */
    });
  }

  return sanitized.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const tA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const tB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return tB - tA;
  });
}
export async function getBook(id: string): Promise<Book | null> {
  if (!id || id === 'new') return null;
  const db = supabase();
  if (db) {
    try {
      const { data, error } = await db.from('books').select('id, data').eq('id', id).maybeSingle();
      if (!error && data?.data) {
        return sanitizeBook(data.data as Book);
      }
    } catch {
      /* fallback to scanning all */
    }
  }
  let books = await getBooks();
  let b = books.find((x) => x.id === id) ?? null;
  if (!b && id && id !== 'new') {
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      books = await getBooks();
      b = books.find((x) => x.id === id) ?? null;
      if (b) break;
    }
  }
  return b ? sanitizeBook(b) : null;
}
export async function getBookBySlug(slug: string): Promise<Book | null> {
  if (!slug) return null;
  const db = supabase();
  if (db) {
    try {
      const { data, error } = await db.from('books').select('id, data').filter('data->>slug', 'eq', slug).maybeSingle();
      if (!error && data?.data) {
        return sanitizeBook(data.data as Book);
      }
    } catch {
      /* fallback to scanning all */
    }
  }
  const b = (await getBooks()).find((b) => b.slug === slug) ?? null;
  return b ? sanitizeBook(b) : null;
}
export async function saveBook(book: Book) {
  const safe = sanitizeBook(book);
  return upsert('books', safe);
}
export async function saveBooks(books: Book[]) {
  const safe = books.map(sanitizeBook);
  return upsertMany('books', safe);
}
export async function deleteBook(id: string) {
  return remove('books', id);
}
export async function saveBookOrder(ids: string[]) {
  const books = await getBooks();
  const changed = ids
    .map((id, i) => {
      const b = books.find((x) => x.id === id);
      return b ? { ...b, order: i + 1 } : null;
    })
    .filter(Boolean) as Book[];
  return upsertMany('books', changed.map(sanitizeBook));
}

/* --- Book Reviews --- */
export async function addReview(bookId: string, review: Review) {
  const book = await getBook(bookId);
  if (!book) throw new Error('Book not found');
  const reviews = [...(book.reviews ?? []), review];
  await saveBook({ ...book, reviews });
}

export async function updateReview(bookId: string, reviewId: string, patch: Partial<Review>) {
  const book = await getBook(bookId);
  if (!book) throw new Error('Book not found');
  const reviews = (book.reviews ?? []).map((r) => (r.id === reviewId ? { ...r, ...patch } : r));
  await saveBook({ ...book, reviews });
}

export async function deleteReview(bookId: string, reviewId: string) {
  const book = await getBook(bookId);
  if (!book) throw new Error('Book not found');
  const reviews = (book.reviews ?? []).filter((r) => r.id !== reviewId);
  await saveBook({ ...book, reviews });
}

/* ---------------- Videos ---------------- */
export async function getVideos(): Promise<Video[]> {
  return (await all<Video>('videos')).sort((a, b) => a.order - b.order);
}
export async function saveVideo(v: Video) {
  return upsert('videos', v);
}
export async function deleteVideo(id: string) {
  return remove('videos', id);
}
export async function saveVideoOrder(ids: string[]) {
  const vids = await getVideos();
  const changed = ids
    .map((id, i) => {
      const v = vids.find((x) => x.id === id);
      return v ? { ...v, order: i + 1 } : null;
    })
    .filter(Boolean) as Video[];
  return upsertMany('videos', changed);
}

/* ---------------- Site settings ---------------- */
export async function getSite(): Promise<SiteSettings> {
  const rows = await all<SiteSettings & { id: string }>('settings');
  const row = rows.find((r) => r.id === 'site');
  const { id: _id, ...rest } = row ?? { id: 'site', ...seedSite };
  return { ...seedSite, ...rest };
}
export async function saveSite(s: SiteSettings) {
  return upsert('settings', { id: 'site', ...s });
}

/* ---------------- Advance readers ---------------- */
export async function getReaders(): Promise<Reader[]> {
  return (await all<Reader>('readers')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function addReader(r: Reader) {
  const existing = (await getReaders()).find((x) => x.email.toLowerCase() === r.email.toLowerCase());
  if (existing) {
    if (existing.format !== r.format && !existing.format.includes(r.format)) {
      const updated = { ...existing, format: existing.format + ' & ' + r.format };
      await upsert('readers', updated);
      return { duplicate: false as const, reader: updated };
    }
    return { duplicate: true as const, reader: existing };
  }
  await upsert('readers', r);
  return { duplicate: false as const, reader: r };
}
export async function deleteReader(id: string) {
  return remove('readers', id);
}
export async function updateReader(id: string, patch: Partial<Reader>): Promise<Reader> {
  const readers = await getReaders();
  const r = readers.find((x) => x.id === id);
  if (!r) throw new Error('Reader not found');
  const updated = { ...r, ...patch };
  await upsert('readers', updated);
  return updated;
}

const ALLOWED_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

const ALLOWED_UPLOAD_FOLDERS = new Set(['covers', 'banners', 'author', 'videos']);

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
    throw new Error('Invalid upload destination folder.');
  }
  let ext = ALLOWED_EXTENSIONS.get(file.type);
  if (!ext) {
    const lname = (file.name || '').toLowerCase();
    if (lname.endsWith('.jpg') || lname.endsWith('.jpeg')) ext = 'jpg';
    else if (lname.endsWith('.png')) ext = 'png';
    else if (lname.endsWith('.webp')) ext = 'webp';
  }
  if (!ext) throw new Error('Please upload a JPG, PNG or WebP image.');
  if (file.size > 4.2 * 1024 * 1024) throw new Error('Images must be under 4 MB for upload on Vercel.');
  const name = `${folder}/${Date.now()}-${newId()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const db = supabase();
  if (!db) {
    try {
      const dir = path.join(DATA_DIR, 'uploads', folder);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(DATA_DIR, 'uploads', name), buf);
    } catch {
      throw new Error('This server cannot store uploaded images. Add the Supabase keys (see README) to enable uploads.');
    }
    return `/uploads/${name}`;
  }
  const bucket = process.env.SUPABASE_BUCKET || 'media';
  const contentType = file.type || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
  const { error } = await db.storage.from(bucket).upload(name, buf, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return db.storage.from(bucket).getPublicUrl(name).data.publicUrl;
}

/* ---------------- CRM Notifications ---------------- */
export async function getCrmNotifications(limit?: number): Promise<{ notifications: CrmNotification[]; unreadCount: number }> {
  const [readers, books, site] = await Promise.all([getReaders(), getBooks(), getSite()]);
  const lastSeen = site.lastSeenReaders ? new Date(site.lastSeenReaders).getTime() : 0;

  const notifications: CrmNotification[] = [];

  for (const r of readers) {
    const isUnread = new Date(r.createdAt).getTime() > lastSeen;
    notifications.push({
      id: `reader-${r.id}`,
      type: 'reader',
      title: `${r.name || 'New reader'} joined Advance Readers`,
      subtitle: `${r.format || 'Advance Copy'} · ${r.email}`,
      createdAt: r.createdAt,
      href: `/admin/notifications?highlight=reader-${r.id}`,
      unread: isUnread,
      metadata: {
        email: r.email,
        format: r.format,
        readerName: r.name,
      }
    });
  }

  for (const b of books) {
    for (const rev of b.reviews ?? []) {
      const isUnread = !rev.approved || (new Date(rev.createdAt).getTime() > lastSeen);
      const stars = Math.max(0, Math.min(5, Math.floor(rev.rating || 0)));
      notifications.push({
        id: `rev-${rev.id}`,
        type: 'review',
        title: `${rev.name} reviewed "${b.title}"`,
        subtitle: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ${rev.approved ? 'Approved' : 'Pending Approval'}`,
        detail: rev.text,
        createdAt: rev.createdAt,
        href: `/admin/notifications?highlight=rev-${rev.id}`,
        unread: isUnread,
        metadata: {
          bookTitle: b.title,
          bookId: b.id,
          rating: rev.rating,
          readerName: rev.name,
        }
      });
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = notifications.filter(n => n.unread).length;

  return {
    notifications: typeof limit === 'number' ? notifications.slice(0, limit) : notifications,
    unreadCount
  };
}
