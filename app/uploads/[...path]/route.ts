import { promises as fs } from 'fs';
import path from 'path';

// Serves images uploaded in the admin panel when running without Supabase (local files in /data/uploads).
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const ALLOWED_FOLDERS = new Set(['covers', 'banners', 'author']);

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (!parts || parts.length < 2) {
    return new Response('Not found', { status: 404 });
  }

  const [folder] = parts;
  if (!ALLOWED_FOLDERS.has(folder)) {
    return new Response('Not found', { status: 404 });
  }

  // Validate each path component contains only safe alphanumeric/hyphen/period characters (no directory traversal)
  for (const part of parts) {
    if (!part || !/^[a-zA-Z0-9_\-\.]+$/.test(part) || part.includes('..')) {
      return new Response('Invalid path', { status: 400 });
    }
  }

  const root = path.join(process.cwd(), 'data', 'uploads');
  const file = path.normalize(path.join(root, ...parts));
  if (!file.startsWith(root + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext];
  if (!type) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const buf = await fs.readFile(file);
    return new Response(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

