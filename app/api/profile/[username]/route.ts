import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { LEAGUES } from '@/lib/football-api';
import type { ProfileStats, LeagueStats } from '@/app/api/profile/stats/route';

export type PublicProfile = {
  /** موجود فقط عند جلب الملف الشخصي من قِبل صاحبه — لا يُكشف للعموم */
  user_id?: string;
  username: string;
  favorite_team: string | null;
  total_points: number;
  created_at: string;
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
  const { userId: callerId } = await auth();
  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, favorite_team, total_points, created_at')
    .eq('username', username)
    .single();

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // league_id مخزون في predictions — لا حاجة لاستدعاء Football API
  // نجلب كل التوقعات (pending + settled) عشان total وpending يكونان دقيقين
  const { data: predictions } = await supabase
    .from('predictions')
    .select('points_earned, league_id')
    .eq('user_id', profile.id);

  const preds = predictions ?? [];
  const settled = preds.filter(p => p.points_earned !== null);
  const correct = settled.filter(p => p.points_earned! > 0).length;
  const wrong = settled.filter(p => p.points_earned === 0).length;
  const pending = preds.filter(p => p.points_earned === null).length;
  const accuracy = settled.length > 0 ? Math.round((correct / settled.length) * 100) : 0;

  // إحصائيات الدوري من المستقرة فقط (مثل profile/stats)
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

  const result: PublicProfile = {
    // user_id يُعاد فقط لصاحب الملف — لا يُكشف للزوار الآخرين
    ...(callerId === profile.id ? { user_id: profile.id } : {}),
    username: profile.username,
    favorite_team: profile.favorite_team,
    total_points: profile.total_points,
    created_at: profile.created_at,
    stats: { total: preds.length, correct, wrong, pending, accuracy, byLeague },
  };

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
