import { NextRequest, NextResponse } from 'next/server';
import { getStandings } from '@/lib/football-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = Number(searchParams.get('league') ?? '307');
  const season = Number(searchParams.get('season') ?? '2024');

  try {
    const standings = await getStandings(league, season);
    return NextResponse.json(standings ?? [], {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 دقيقة
      },
    });
  } catch (err) {
    console.error('Standings API error:', err);
    return NextResponse.json([]);
  }
}
