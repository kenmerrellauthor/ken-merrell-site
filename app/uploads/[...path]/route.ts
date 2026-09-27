import { promises as fs } from 'fs';
import path from 'path';

// Serves images uploaded in the admin panel when the site runs without Supabase (local files in /data/uploads).
const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const root = path.join(process.cwd(), 'data', 'uploads');
  const file = path.normalize(path.join(root, ...parts));
  if (!file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(file);
    return new Response(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
