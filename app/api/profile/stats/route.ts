import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { LEAGUES } from '@/lib/football-api';

export type LeagueStats = {
  leagueId: number;
  leagueName: string;
  leagueFlag: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

export type ProfileStats = {
  total: number;
  correct: number;
  wrong: number;
  pending: number;
  accuracy: number;
  byLeague: LeagueStats[];
};

const leagueInfo = Object.values(LEAGUES).reduce<Record<number, { name: string; flag: string }>>(
  (acc, l) => { acc[l.id] = { name: l.name, flag: l.flag }; return acc; },
  {}
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // league_id مخزون في predictions — لا حاجة لاستدعاء Football API
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, points_earned, league_id')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const predictions = data ?? [];
  const settled = predictions.filter(p => p.points_earned !== null);
  const correct = settled.filter(p => p.points_earned! > 0).length;
  const wrong = settled.filter(p => p.points_earned === 0).length;
  const pending = predictions.filter(p => p.points_earned === null).length;
  const accuracy = settled.length > 0 ? Math.round((correct / settled.length) * 100) : 0;

  // إحصائيات حسب الدوري — من league_id المخزون مباشرة
  const leagueStatsMap: Record<number, { total: number; correct: number; wrong: number }> = {};
  for (const pred of settled) {
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

  return NextResponse.json({ total: predictions.length, correct, wrong, pending, accuracy, byLeague });
}
