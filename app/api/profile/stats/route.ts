import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { LEAGUES } from '@/lib/football-api';

export type LeagueStats = {
  leagueId: number;
  leagueName: string;
  leagueFlag: string;
  total: number;
  correct: number; // points_earned > 0
  wrong: number;   // points_earned === 0
  accuracy: number; // %
};

export type ProfileStats = {
  total: number;
  correct: number;
  wrong: number;
  pending: number;
  accuracy: number;
  byLeague: LeagueStats[];
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, points_earned')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const predictions = data ?? [];

  // إحصائيات عامة (فقط التوقعات المحسوبة)
  const settled = predictions.filter(p => p.points_earned !== null);
  const correct = settled.filter(p => p.points_earned! > 0).length;
  const wrong = settled.filter(p => p.points_earned === 0).length;
  const pending = predictions.filter(p => p.points_earned === null).length;
  const accuracy = settled.length > 0 ? Math.round((correct / settled.length) * 100) : 0;

  // إحصائيات حسب الدوري — نحتاج بيانات المباراة لمعرفة الدوري
  // نجلب الـ fixture_id → league_id من جدول منفصل أو نستخدم نمط match_id
  // بما أننا نخزن match_id فقط، نجلب تفاصيل المباريات من Football API بشكل batch
  // الحل الأبسط: جلب league_id لكل مباراة عبر Supabase إن خزناه، أو عبر API

  // نستخدم جدول predictions مع join لو خزنا league، بما أننا لم نخزنه
  // نحسب by league من خلال جلب league_id من fixtures endpoint لكل match_id unique
  const matchIds = Array.from(new Set(predictions.map(p => p.match_id)));

  // جلب league لكل مباراة من Football API (مخزنة في cache)
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
      } catch {
        // skip
      }
    })
  );

  // تجميع الإحصائيات حسب الدوري
  const leagueStatsMap: Record<number, { total: number; correct: number; wrong: number }> = {};

  for (const pred of settled) {
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

  const stats: ProfileStats = {
    total: predictions.length,
    correct,
    wrong,
    pending,
    accuracy,
    byLeague,
  };

  return NextResponse.json(stats);
}
