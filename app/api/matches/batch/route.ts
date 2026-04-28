import { NextRequest, NextResponse } from 'next/server';
import { getFixtureById } from '@/lib/football-api';

// GET /api/matches/batch?ids=1234,5678,9012
// يُجلب تفاصيل مباريات متعددة بالـ ID — للاستخدام في صفحة السجل
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);

  if (ids.length === 0) return NextResponse.json([]);

  const results = await Promise.allSettled(
    ids.map(id => getFixtureById(Number(id)))
  );

  const fixtures = results
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean);

  return NextResponse.json(fixtures, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}
