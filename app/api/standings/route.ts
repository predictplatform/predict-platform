import { NextRequest, NextResponse } from 'next/server';
import { getStandings } from '@/lib/football-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = Number(searchParams.get('league') ?? '307');
  const season = Number(searchParams.get('season') ?? '2024');

  try {
    const standings = await getStandings(league, season);
    return NextResponse.json(standings ?? []);
  } catch (err) {
    console.error('Standings API error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
