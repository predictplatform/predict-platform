import { NextRequest, NextResponse } from 'next/server';
import { getTopScorers } from '@/lib/football-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = Number(searchParams.get('league') ?? '307');
  const season = Number(searchParams.get('season') ?? '2024');

  try {
    const data = await getTopScorers(league, season);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
