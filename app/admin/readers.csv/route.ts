import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { getReaders } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Escapes double quotes and neutralizes spreadsheet formula injection (=, +, -, @, tab, CR)
const cell = (s: string) => `"${String(s).replace(/"/g, '""').replace(/^[=+\-@\t\r]/, "'$&")}"`;

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const admin = await verifyToken(token);
  if (!admin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rows = await getReaders();
  const dateStr = new Date().toISOString().slice(0, 10);
  const csv = [
    'Name,Email,Book Wishlist,Format,Agreed to review,Signed up',
    ...rows.map((r) => [r.name, r.email, r.bookTitle || 'General list', r.format, r.agreed ? 'Yes' : 'No', r.createdAt].map(cell).join(','))
  ].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="advance-readers-${dateStr}.csv"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    }
  });
}

