import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getTopScorers } from '@/lib/football-api';

const CV = process.env.CACHE_VERSION ?? 'v3';

// مفتاح الـ cache يشمل CV — تغييره يمسح الكاش فوراً
const cachedGetTopScorers = unstable_cache(
  (league: number, season: number) => getTopScorers(league, season),
  [`api-stats-${CV}`],
  { revalidate: 3600 },
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = Number(searchParams.get('league') ?? '307');
  const season = Number(searchParams.get('season') ?? '2024');

  try {
    const data = await cachedGetTopScorers(league, season);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json([]);
  }
}
