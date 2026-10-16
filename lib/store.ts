import 'server-only';
import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Book, CrmNotification, Reader, Review, SiteSettings, Video, BlogPost, BlogComment } from './types';
import { seedBooks, seedSite, seedVideos } from './seed';

/*
 * One small storage layer with two backends:
 *  - Supabase (production): set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Tables are in supabase/schema.sql.
 *  - Local JSON files in /data (development, or a server with a writable disk).
 * Every table stores one JSON document per row, so adding a field never needs a migration.
 */

type Table = 'books' | 'videos' | 'readers' | 'settings' | 'blogs';

let sb: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)?.trim();
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
const TMP_DATA_DIR = path.join('/tmp', 'data');

const seeds: Record<Table, { id: string }[]> = {
  books: seedBooks,
  videos: seedVideos,
  readers: [],
  settings: [{ id: 'site', ...seedSite }],
  blogs: []
};

async function readLocal<T>(table: Table): Promise<T[]> {
  // Check /tmp serverless buffer first
  try {
    const tmpFile = path.join(TMP_DATA_DIR, `${table}.json`);
    const content = await fs.readFile(tmpFile, 'utf8');
    return JSON.parse(content) as T[];
  } catch {
    /* fallback to project data dir */
  }

  const file = path.join(DATA_DIR, `${table}.json`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T[];
  } catch {
    const seed = seeds[table] as unknown as T[];
    return seed;
  }
}

async function writeLocal<T>(table: Table, rows: T[]) {
  // Always update /tmp serverless buffer (writable in Vercel lambda functions)
  try {
    await fs.mkdir(TMP_DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(TMP_DATA_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
  } catch {
    /* ignore /tmp issues */
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      // Running on read-only serverless filesystem: /tmp buffer was written successfully above
      return;
    }
    throw e;
  }
}

const missingTables = new Set<string>();

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60_000; // 60s cache for ultra-fast tab switches and instant edits

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(table?: Table): void {
  if (table) {
    memoryCache.delete(`table:${table}`);
    memoryCache.delete('crm:notifications');
  } else {
    memoryCache.clear();
  }
}

async function all<T extends { id: string }>(table: Table): Promise<T[]> {
  const cacheKey = `table:${table}`;
  const cached = getCached<T[]>(cacheKey);
  if (cached) return cached;

  const db = supabase();
  let result: T[];
  if (!db || missingTables.has(table)) {
    result = await readLocal<T>(table);
  } else {
    try {
      const { data, error } = await db.from(table).select('id, data');
      if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          missingTables.add(table);
        } else {
          console.warn(`Supabase read ${table} error (${error.message}), falling back to local.`);
        }
        result = await readLocal<T>(table);
      } else {
        const rows = data ?? [];
        if (!rows.length && seeds[table].length) {
          try {
            await db.from(table).insert(seeds[table].map((r) => ({ id: r.id, data: r })));
          } catch {
            /* ignore seed error */
          }
          result = seeds[table] as unknown as T[];
        } else {
          result = rows.map((r) => r.data as T);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
        missingTables.add(table);
      } else {
        console.warn(`Supabase read ${table} exception (${err?.message || err}), falling back to local.`);
      }
      result = await readLocal<T>(table);
    }
  }

  setCached(cacheKey, result);
  return result;
}

async function upsert<T extends { id: string }>(table: Table, row: T) {
  invalidateCache(table);
  const db = supabase();
  if (!db || missingTables.has(table)) {
    const rows = await readLocal<T>(table);
    const i = rows.findIndex((r) => r.id === row.id);
    if (i >= 0) rows[i] = row;
    else rows.push(row);
    return writeLocal(table, rows);
  }
  try {
    const { error } = await db.from(table).upsert({ id: row.id, data: row });
    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        missingTables.add(table);
      } else {
        console.warn(`Supabase write ${table} error (${error.message}), falling back to local.`);
      }
      const rows = await readLocal<T>(table);
      const i = rows.findIndex((r) => r.id === row.id);
      if (i >= 0) rows[i] = row;
      else rows.push(row);
      return writeLocal(table, rows);
    }
  } catch (e: any) {
    if (e?.message?.includes('schema cache') || e?.message?.includes('does not exist')) {
      missingTables.add(table);
    }
    const rows = await readLocal<T>(table);
    const i = rows.findIndex((r) => r.id === row.id);
    if (i >= 0) rows[i] = row;
    else rows.push(row);
    return writeLocal(table, rows);
  }
}

async function upsertMany<T extends { id: string }>(table: Table, rows: T[]) {
  invalidateCache(table);
  const db = supabase();
  if (!db || missingTables.has(table)) {
    const cur = await readLocal<T>(table);
    const map = new Map(cur.map((r) => [r.id, r]));
    rows.forEach((r) => map.set(r.id, r));
    return writeLocal(table, [...map.values()]);
  }
  try {
    const { error } = await db.from(table).upsert(rows.map((r) => ({ id: r.id, data: r })));
    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        missingTables.add(table);
      } else {
        console.warn(`Supabase writeMany ${table} error (${error.message}), falling back to local.`);
      }
      const cur = await readLocal<T>(table);
      const map = new Map(cur.map((r) => [r.id, r]));
      rows.forEach((r) => map.set(r.id, r));
      return writeLocal(table, [...map.values()]);
    }
  } catch (err: any) {
    if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
      missingTables.add(table);
    }
    const cur = await readLocal<T>(table);
    const map = new Map(cur.map((r) => [r.id, r]));
    rows.forEach((r) => map.set(r.id, r));
    return writeLocal(table, [...map.values()]);
  }
}

async function remove(table: Table, id: string) {
  invalidateCache(table);
  const db = supabase();
  if (!db || missingTables.has(table)) {
    const rows = await readLocal<{ id: string }>(table);
    return writeLocal(table, rows.filter((r) => r.id !== id));
  }
  try {
    const { error } = await db.from(table).delete().eq('id', id);
    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        missingTables.add(table);
      } else {
        console.warn(`Supabase delete ${table} error (${error.message}), falling back to local.`);
      }
      const rows = await readLocal<{ id: string }>(table);
      return writeLocal(table, rows.filter((r) => r.id !== id));
    }
  } catch (err: any) {
    if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
      missingTables.add(table);
    }
    const rows = await readLocal<{ id: string }>(table);
    return writeLocal(table, rows.filter((r) => r.id !== id));
  }
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
    videoUrl: (Array.isArray(b.videos) && b.videos.length > 0 ? b.videos[0]?.url : b.videoUrl) || '',
    videoThumbnail: (Array.isArray(b.videos) && b.videos.length > 0 ? b.videos[0]?.thumbnail : b.videoThumbnail) ?? null,
    videos: Array.isArray(b.videos) && b.videos.length > 0
      ? b.videos.filter(v => v && typeof v.url === 'string' && v.url.trim()).map((v, i) => ({
          id: v.id || `bv-${i + 1}`,
          url: v.url.trim(),
          title: typeof v.title === 'string' ? v.title.trim() : '',
          type: v.type || (i === 0 ? 'Trailer' : 'Reading'),
          thumbnail: v.thumbnail ?? null,
          duration: v.duration || '',
        }))
      : (b.videoUrl && b.videoUrl.trim()
          ? [{
              id: 'bv-1',
              url: b.videoUrl.trim(),
              title: (b as any).videoTitle ? String((b as any).videoTitle).trim() : '',
              type: 'Trailer',
              thumbnail: b.videoThumbnail ?? null,
              duration: '',
            }]
          : []),
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
export const getBooks = cache(async (): Promise<Book[]> => {
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
});
export const getBook = cache(async (id: string): Promise<Book | null> => {
  if (!id || id === 'new') return null;
  const cachedBooks = getCached<Book[]>('table:books');
  if (cachedBooks) {
    const found = cachedBooks.find((x) => x.id === id);
    if (found) return sanitizeBook(found);
  }
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
  const books = await getBooks();
  const b = books.find((x) => x.id === id) ?? null;
  return b ? sanitizeBook(b) : null;
});
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
export const getSite = cache(async (): Promise<SiteSettings> => {
  const rows = await all<SiteSettings & { id: string }>('settings');
  const row = rows.find((r) => r.id === 'site');
  const { id: _id, ...rest } = row ?? { id: 'site', ...seedSite };
  return { ...seedSite, ...rest };
});
export async function saveSite(s: SiteSettings) {
  return upsert('settings', { id: 'site', ...s });
}

/* ---------------- Advance readers ---------------- */
export const getReaders = cache(async (): Promise<Reader[]> => {
  return (await all<Reader>('readers')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});
export async function addReader(r: Reader) {
  const existing = (await getReaders()).find((x) => x.email.toLowerCase() === r.email.toLowerCase());
  if (existing) {
    let changed = false;
    let updated = { ...existing };
    if (existing.format !== r.format && !existing.format.includes(r.format)) {
      updated.format = existing.format + ' & ' + r.format;
      changed = true;
    }
    if (r.bookTitle && (!existing.bookTitle || !existing.bookTitle.includes(r.bookTitle))) {
      updated.bookTitle = existing.bookTitle ? `${existing.bookTitle}, ${r.bookTitle}` : r.bookTitle;
      changed = true;
    }
    if (changed) {
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

const IMAGE_FORMATS = [
  { ext: 'jpg', contentType: 'image/jpeg', matches: (bytes: Buffer) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { ext: 'png', contentType: 'image/png', matches: (bytes: Buffer) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', contentType: 'image/webp', matches: (bytes: Buffer) => bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
] as const;

const ALLOWED_UPLOAD_FOLDERS = new Set(['covers', 'banners', 'author', 'videos']);

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
    throw new Error('Invalid upload destination folder.');
  }
  if (file.size > 4.2 * 1024 * 1024) throw new Error('Images must be under 4 MB for upload on Vercel.');
  const buf = Buffer.from(await file.arrayBuffer());
  // Browsers and mobile photo pickers sometimes send a blank or non-standard
  // MIME type for valid images. Detect the actual format from its signature.
  const format = IMAGE_FORMATS.find((candidate) => candidate.matches(buf));
  if (!format) throw new Error('Please upload a JPG, PNG or WebP image. HEIC and AVIF files need to be converted first.');
  const name = `${folder}/${Date.now()}-${newId()}.${format.ext}`;

  const db = supabase();
  const contentType = format.contentType || file.type || 'image/jpeg';

  if (!db) {
    try {
      const dir = path.join(DATA_DIR, 'uploads', folder);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(DATA_DIR, 'uploads', name), buf);
      return `/uploads/${name}`;
    } catch {
      // In serverless / read-only production where local fs isn't writable and Supabase isn't connected,
      // fallback to inline data URI so saves never fail!
      return `data:${contentType};base64,${buf.toString('base64')}`;
    }
  }
  const bucket = process.env.SUPABASE_BUCKET || 'media';
  try {
    const { error } = await db.storage.from(bucket).upload(name, buf, { contentType, upsert: true });
    if (error) {
      console.warn(`Supabase storage upload (${error.message}), falling back to base64 data URI.`);
      return `data:${contentType};base64,${buf.toString('base64')}`;
    }
    return db.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  } catch (err: any) {
    console.warn(`Supabase storage exception (${err?.message || err}), falling back to base64 data URI.`);
    return `data:${contentType};base64,${buf.toString('base64')}`;
  }
}

/* ---------------- CRM Notifications ---------------- */
export const getCrmNotifications = cache(async (limit?: number): Promise<{ notifications: CrmNotification[]; unreadCount: number }> => {
  const cacheKey = 'crm:notifications';
  const cached = getCached<{ notifications: CrmNotification[]; unreadCount: number }>(cacheKey);
  if (cached) {
    return {
      notifications: typeof limit === 'number' ? cached.notifications.slice(0, limit) : cached.notifications,
      unreadCount: cached.unreadCount,
    };
  }

  const [readers, books, site, blogs] = await Promise.all([getReaders(), getBooks(), getSite(), getBlogs()]);
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

  for (const blog of blogs) {
    for (const c of blog.comments ?? []) {
      const isUnread = !c.approved || (new Date(c.createdAt).getTime() > lastSeen);
      notifications.push({
        id: `comment-${c.id}`,
        type: 'comment',
        title: `${c.authorName} commented on "${blog.title}"`,
        subtitle: `${c.authorEmail} · ${c.approved ? 'Approved' : 'Pending'}`,
        detail: c.content,
        createdAt: c.createdAt,
        href: `/admin/blogs/${blog.id}#comments`,
        unread: isUnread,
        metadata: {
          blogTitle: blog.title,
          blogId: blog.id,
          readerName: c.authorName,
          email: c.authorEmail,
        }
      });
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = notifications.filter(n => n.unread).length;

  const result = { notifications, unreadCount };
  setCached(cacheKey, result);

  return {
    notifications: typeof limit === 'number' ? notifications.slice(0, limit) : notifications,
    unreadCount
  };
});

/* --- Blog Posts --- */

function sanitizeBlog(post: BlogPost): BlogPost {
  return {
    ...post,
    id: post.id || `blog-${crypto.randomUUID().slice(0, 8)}`,
    slug: (post.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: (post.title || '').trim(),
    excerpt: (post.excerpt || '').trim(),
    content: (post.content || '').trim(),
    coverImage: post.coverImage || null,
    category: (post.category || 'Historical Fiction Insights').trim(),
    tags: Array.isArray(post.tags) ? post.tags.map((t) => t.trim()).filter(Boolean) : [],
    readTimeMinutes: Math.max(1, Math.round((post.content || '').split(/\s+/).length / 200)),
    authorName: (post.authorName || 'Ken Merrell').trim(),
    publishedAt: post.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: Boolean(post.isPublished),
    featured: Boolean(post.featured),
    views: typeof post.views === 'number' ? post.views : 0,
    relatedBookSlug: post.relatedBookSlug || null,
    metaTitle: post.metaTitle?.trim() || post.title,
    metaDescription: post.metaDescription?.trim() || post.excerpt,
    canonicalUrl: post.canonicalUrl?.trim() || undefined,
    keyTakeaways: Array.isArray(post.keyTakeaways) ? post.keyTakeaways.filter(Boolean) : [],
    faqItems: Array.isArray(post.faqItems) ? post.faqItems.filter((f) => f.question && f.answer) : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
  };
}

export const getBlogs = cache(async (): Promise<BlogPost[]> => {
  const rows = await all<BlogPost>('blogs');
  return rows.map(sanitizeBlog).sort((a, b) => {
    const tA = new Date(a.publishedAt || a.updatedAt).getTime();
    const tB = new Date(b.publishedAt || b.updatedAt).getTime();
    return tB - tA;
  });
});

export const getPublishedBlogs = cache(async (): Promise<BlogPost[]> => {
  const allPosts = await getBlogs();
  return allPosts.filter((b) => b.isPublished);
});

export const getBlog = cache(async (id: string): Promise<BlogPost | null> => {
  if (!id || id === 'new') return null;
  const cachedBlogs = getCached<BlogPost[]>('table:blogs');
  if (cachedBlogs) {
    const found = cachedBlogs.find((x) => x.id === id);
    if (found) return sanitizeBlog(found);
  }
  const db = supabase();
  if (db && !missingTables.has('blogs')) {
    try {
      const { data, error } = await db.from('blogs').select('id, data').eq('id', id).maybeSingle();
      if (!error && data?.data) {
        return sanitizeBlog(data.data as BlogPost);
      }
      if (error?.message?.includes('schema cache') || error?.message?.includes('does not exist')) {
        missingTables.add('blogs');
      }
    } catch {
      /* fallback to scanning all */
    }
  }
  const blogs = await getBlogs();
  const b = blogs.find((x) => x.id === id) ?? null;
  return b ? sanitizeBlog(b) : null;
});

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  const db = supabase();
  if (db && !missingTables.has('blogs')) {
    try {
      const { data, error } = await db.from('blogs').select('id, data').filter('data->>slug', 'eq', slug).maybeSingle();
      if (!error && data?.data) {
        return sanitizeBlog(data.data as BlogPost);
      }
      if (error?.message?.includes('schema cache') || error?.message?.includes('does not exist')) {
        missingTables.add('blogs');
      }
    } catch {
      /* fallback to scanning all */
    }
  }
  const blogs = await getBlogs();
  const b = blogs.find((x) => x.slug === slug) ?? null;
  return b ? sanitizeBlog(b) : null;
}

export async function saveBlog(post: BlogPost): Promise<void> {
  const safe = sanitizeBlog(post);
  return upsert('blogs', safe);
}

export async function deleteBlog(id: string): Promise<void> {
  return remove('blogs', id);
}

export async function incrementBlogViews(id: string): Promise<void> {
  const blog = await getBlog(id);
  if (!blog) return;
  blog.views = (blog.views || 0) + 1;
  return upsert('blogs', blog);
}

export async function addBlogComment(
  blogIdOrSlug: string,
  comment: { authorName: string; authorEmail: string; content: string }
): Promise<BlogComment> {
  const blogs = await getBlogs();
  const blog = blogs.find((b) => b.id === blogIdOrSlug || b.slug === blogIdOrSlug);
  if (!blog) throw new Error('Blog post not found.');

  const newComment: BlogComment = {
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    blogId: blog.id,
    authorName: comment.authorName.trim(),
    authorEmail: comment.authorEmail.trim(),
    content: comment.content.trim(),
    createdAt: new Date().toISOString(),
    approved: true, // published immediately, can be moderated in admin
  };

  const comments = [...(blog.comments || []), newComment];
  const updatedBlog: BlogPost = { ...blog, comments, updatedAt: new Date().toISOString() };
  await saveBlog(updatedBlog);
  return newComment;
}

export async function deleteBlogComment(blogId: string, commentId: string): Promise<void> {
  const blog = await getBlog(blogId);
  if (!blog) throw new Error('Blog post not found.');
  const comments = (blog.comments || []).filter((c) => c.id !== commentId);
  await saveBlog({ ...blog, comments });
}

export async function replyBlogComment(blogId: string, commentId: string, replyText: string): Promise<BlogComment | null> {
  const blog = await getBlog(blogId);
  if (!blog) throw new Error('Blog post not found.');
  const comments = [...(blog.comments || [])];
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) throw new Error('Comment not found.');
  comments[idx] = {
    ...comments[idx],
    authorReply: replyText.trim(),
    authorReplyAt: new Date().toISOString(),
  };
  await saveBlog({ ...blog, comments });
  return comments[idx];
}

export async function toggleBlogCommentApproval(blogId: string, commentId: string): Promise<BlogComment | null> {
  const blog = await getBlog(blogId);
  if (!blog) throw new Error('Blog post not found.');
  const comments = [...(blog.comments || [])];
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) throw new Error('Comment not found.');
  comments[idx] = {
    ...comments[idx],
    approved: !comments[idx].approved,
  };
  await saveBlog({ ...blog, comments });
  return comments[idx];
}


