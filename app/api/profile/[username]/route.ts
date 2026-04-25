import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { LEAGUES } from '@/lib/football-api';
import type { ProfileStats, LeagueStats } from '@/app/api/profile/stats/route';

export type PublicProfile = {
  username: string;
  favorite_team: string | null;
  total_points: number;
  stats: ProfileStats;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = createServerSupabaseClient();

  // جلب الملف الشخصي بالاسم
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, favorite_team, total_points')
    .eq('username', username)
    .single();

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // جلب التوقعات المحسوبة فقط
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, points_earned')
    .eq('user_id', profile.id)
    .not('points_earned', 'is', null);

  const preds = predictions ?? [];
  const correct = preds.filter(p => p.points_earned! > 0).length;
  const wrong = preds.filter(p => p.points_earned === 0).length;
  const accuracy = preds.length > 0 ? Math.round((correct / preds.length) * 100) : 0;

  // إحصائيات حسب الدوري
  const matchIds = Array.from(new Set(preds.map(p => p.match_id)));
  const leagueMap: Record<string, number> = {};

  await Promise.allSettled(
    matchIds.map(async (matchId) => {
      try {
        const res = await fetch(
          `https://${process.env.FOOTBALL_API_HOST}/fixtures?id=${matchId}`,
          {
            headers: {
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY!,
              'x-rapidapi-host': process.env.FOOTBALL_API_HOST!,
            },
            next: { revalidate: 3600 },
          }
        );
        const json = await res.json();
        const fixture = json?.response?.[0];
        if (fixture) leagueMap[matchId] = fixture.league.id;
      } catch { /* skip */ }
    })
  );

  const leagueStatsMap: Record<number, { total: number; correct: number; wrong: number }> = {};
  for (const pred of preds) {
    const leagueId = leagueMap[pred.match_id];
    if (!leagueId) continue;
    if (!leagueStatsMap[leagueId]) leagueStatsMap[leagueId] = { total: 0, correct: 0, wrong: 0 };
    leagueStatsMap[leagueId].total++;
    if (pred.points_earned! > 0) leagueStatsMap[leagueId].correct++;
    else leagueStatsMap[leagueId].wrong++;
  }

  const leagueInfo = Object.values(LEAGUES).reduce<Record<number, { name: string; flag: string }>>(
    (acc, l) => { acc[l.id] = { name: l.name, flag: l.flag }; return acc; },
    {}
  );

  const byLeague: LeagueStats[] = Object.entries(leagueStatsMap)
    .map(([id, s]) => {
      const lid = Number(id);
      const info = leagueInfo[lid];
      return {
        leagueId: lid,
        leagueName: info?.name ?? `دوري ${lid}`,
        leagueFlag: info?.flag ?? '🏆',
        total: s.total,
        correct: s.correct,
        wrong: s.wrong,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const result: PublicProfile = {
    username: profile.username,
    favorite_team: profile.favorite_team,
    total_points: profile.total_points,
    stats: {
      total: preds.length,
      correct,
      wrong,
      pending: 0, // لا نكشف التوقعات المعلقة للزوار
      accuracy,
      byLeague,
    },
  };

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
