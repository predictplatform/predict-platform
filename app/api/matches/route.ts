import { NextRequest, NextResponse } from 'next/server';
import { getFixturesByDate, getCacheHeader } from '@/lib/football-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const league = searchParams.get('league') ? Number(searchParams.get('league')) : undefined;

  try {
    const fixtures = await getFixturesByDate(date, league);
    return NextResponse.json(fixtures ?? [], {
      headers: {
        // حية → دقيقتان | غير حية → 5 دقائق
        'Cache-Control': getCacheHeader(fixtures ?? []),
      },
    });
  } catch (err) {
    console.error('Matches API error:', err);
    return NextResponse.json([]);
  }
}
