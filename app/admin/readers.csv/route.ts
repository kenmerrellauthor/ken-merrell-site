import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { getReaders } from '@/lib/store';

export const dynamic = 'force-dynamic';
const cell = (s: string) => `"${String(s).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;

export async function GET() {
  if (!(await verifyToken((await cookies()).get(SESSION_COOKIE)?.value))) return new Response('Not signed in', { status: 401 });
  const rows = await getReaders();
  const csv = ['Name,Email,Format,Agreed to review,Signed up', ...rows.map((r) => [r.name, r.email, r.format, r.agreed ? 'Yes' : 'No', r.createdAt].map(cell).join(','))].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="advance-readers-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
