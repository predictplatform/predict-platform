import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// الحقول المكشوفة للعامة فقط — profile_complete مستبعد عمداً
type LeaderboardProfile = {
  id:            string;
  username:      string;
  avatar_url:    string | null;
  total_points:  number;
  favorite_team: string | null;
  created_at:    string;
};

export type LeaderboardEntry = LeaderboardProfile & {
  rank:                number;
  correct_predictions: number;
  total_predictions:   number;
  accuracy_rate:       number;
  adjusted_points:     number;
};

type LeaderboardResponse = {
  qualified:  LeaderboardEntry[];
  qualifying: LeaderboardEntry[];
};

// عام: 10 توقعات — دوري محدد: 5 توقعات
const MIN_ALL    = 10;
const MIN_LEAGUE = 5;

// GET /api/leaderboard
// GET /api/leaderboard?league_id=944
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leagueParam = searchParams.get('league_id');
  const selectedLeague = leagueParam ? Number(leagueParam) : null;

  const supabase = createServerSupabaseClient();

  // ① جلب الـ profiles — حقول محددة فقط، profile_complete مستبعد
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_points, favorite_team, created_at')
    .limit(200);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((p: LeaderboardProfile) => p.id);
  if (userIds.length === 0) {
    return NextResponse.json({ qualified: [], qualifying: [] } satisfies LeaderboardResponse);
  }

  // ② جلب التوقعات — مفلترة بالدوري إذا محدد
  let predsQuery = supabase
    .from('predictions')
    .select('user_id, points_earned, league_id')
    .in('user_id', userIds);

  if (selectedLeague !== null) {
    predsQuery = predsQuery.eq('league_id', selectedLeague);
  }

  const { data: preds } = await predsQuery;

  // ③ حساب الإحصائيات لكل مستخدم
  const statsMap: Record<string, {
    total: number; settled: number; correct: number; leaguePoints: number;
  }> = {};

  (preds ?? []).forEach((p: { user_id: string; points_earned: number | null }) => {
    if (!statsMap[p.user_id])
      statsMap[p.user_id] = { total: 0, settled: 0, correct: 0, leaguePoints: 0 };
    statsMap[p.user_id].total++;
    if (p.points_earned !== null) {
      statsMap[p.user_id].settled++;
      statsMap[p.user_id].leaguePoints += p.points_earned;
      if (p.points_earned > 0) statsMap[p.user_id].correct++;
    }
  });

  // ④ بناء الإدخالات
  const entries: LeaderboardEntry[] = (profiles ?? []).map((p: LeaderboardProfile) => {
    const s = statsMap[p.id] ?? { total: 0, settled: 0, correct: 0, leaguePoints: 0 };
    const accuracy_rate   = s.settled > 0 ? s.correct / s.settled : 0;
    const basePoints      = selectedLeague === null ? p.total_points : s.leaguePoints;
    const adjusted_points = basePoints * (1 + accuracy_rate);
    return {
      ...p,
      total_points: basePoints,
      rank: 0,
      correct_predictions: s.correct,
      total_predictions:   s.total,
      accuracy_rate,
      adjusted_points,
    };
  });

  // ⑤ إخفاء المستخدمين بلا توقعات في الدوري المحدد
  const relevant = selectedLeague !== null
    ? entries.filter(e => e.total_predictions > 0)
    : entries;

  const MIN = selectedLeague !== null ? MIN_LEAGUE : MIN_ALL;

  const qualified: LeaderboardEntry[] = relevant
    .filter(e => e.total_predictions >= MIN)
    .sort((a, b) =>
      b.adjusted_points !== a.adjusted_points
        ? b.adjusted_points - a.adjusted_points
        : b.accuracy_rate  - a.accuracy_rate
    )
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const qualifying: LeaderboardEntry[] = relevant
    .filter(e => e.total_predictions > 0 && e.total_predictions < MIN)
    .sort((a, b) => b.total_predictions - a.total_predictions)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return NextResponse.json(
    { qualified, qualifying } satisfies LeaderboardResponse,
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
  );
}
