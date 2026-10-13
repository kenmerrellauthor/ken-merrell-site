import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDailyTrafficSeries } from '@/lib/analytics';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const dailyTraffic = await getDailyTrafficSeries();
    return NextResponse.json({ dailyTraffic }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Could not refresh analytics traffic:', error);
    return NextResponse.json({ error: 'Could not refresh analytics traffic' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
