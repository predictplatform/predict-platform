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

const leagueInfo = Object.values(LEAGUES).reduce<Record<number, { name: string; flag: string }>>(
  (acc, l) => { acc[l.id] = { name: l.name, flag: l.flag }; return acc; },
  {}
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, favorite_team, total_points')
    .eq('username', username)
    .single();

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // league_id مخزون في predictions — لا حاجة لاستدعاء Football API
  const { data: predictions } = await supabase
    .from('predictions')
    .select('points_earned, league_id')
    .eq('user_id', profile.id)
    .not('points_earned', 'is', null);

  const preds = predictions ?? [];
  const correct = preds.filter(p => p.points_earned! > 0).length;
  const wrong = preds.filter(p => p.points_earned === 0).length;
  const accuracy = preds.length > 0 ? Math.round((correct / preds.length) * 100) : 0;

  const leagueStatsMap: Record<number, { total: number; correct: number; wrong: number }> = {};
  for (const pred of preds) {
    if (!pred.league_id) continue;
    const lid = pred.league_id;
    if (!leagueStatsMap[lid]) leagueStatsMap[lid] = { total: 0, correct: 0, wrong: 0 };
    leagueStatsMap[lid].total++;
    if (pred.points_earned! > 0) leagueStatsMap[lid].correct++;
    else leagueStatsMap[lid].wrong++;
  }

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
    stats: { total: preds.length, correct, wrong, pending: 0, accuracy, byLeague },
  };

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
