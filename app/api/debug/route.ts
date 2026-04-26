import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.SPORTMONKS_TOKEN;
  const cacheVersion = process.env.CACHE_VERSION ?? 'v1';

  if (!token) {
    return NextResponse.json({ error: 'SPORTMONKS_TOKEN is missing' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/date/2026-04-26?include=participants;scores;league;state&per_page=5&api_token=${token}`,
      { cache: 'no-store' }
    );
    const json = await res.json();
    return NextResponse.json({
      token_prefix: token.slice(0, 8) + '...',
      cache_version: cacheVersion,
      status: res.status,
      count: json.data?.length ?? 0,
      error: json.message ?? null,
      sample: json.data?.[0]?.name ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
