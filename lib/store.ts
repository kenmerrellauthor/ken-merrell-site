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
  if (!sb) sb = createClient(url, key, { auth: { persistSession: false } });
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

/** Returns true if the book was uploaded within the last 3 days. Always computed from createdAt (or updatedAt as fallback). */
export function isBookNew(book: Book): boolean {
  const dateStr = book.createdAt || book.updatedAt;
  if (!dateStr) return false;
  const uploadedTime = new Date(dateStr).getTime();
  if (isNaN(uploadedTime)) return false;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - uploadedTime <= THREE_DAYS_MS;
}

/* ---------------- Books ---------------- */
export async function getBooks(): Promise<Book[]> {
  const rows = await all<Book>('books');
  return rows.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const tA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const tB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return tB - tA;
  });
}
export async function getBook(id: string) {
  const b = (await getBooks()).find((b) => b.id === id) ?? null;
  if (b && !b.reviews) return { ...b, reviews: [] };
  return b;
}
export async function getBookBySlug(slug: string) {
  const b = (await getBooks()).find((b) => b.slug === slug) ?? null;
  if (b && !b.reviews) return { ...b, reviews: [] };
  return b;
}
export async function saveBook(book: Book) {
  // Ensure reviews array always exists
  const safe: Book = { reviews: [], ...book };
  return upsert('books', safe);
}
export async function saveBooks(books: Book[]) {
  return upsertMany('books', books);
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
  return upsertMany('books', changed);
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
  const ext = ALLOWED_EXTENSIONS.get(file.type);
  if (!ext) throw new Error('Please upload a JPG, PNG or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be under 10 MB.');
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
  const { error } = await db.storage.from(bucket).upload(name, buf, { contentType: file.type, upsert: false });
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
      notifications.push({
        id: `rev-${rev.id}`,
        type: 'review',
        title: `${rev.name} reviewed "${b.title}"`,
        subtitle: `${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)} · ${rev.approved ? 'Approved' : 'Pending Approval'}`,
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
