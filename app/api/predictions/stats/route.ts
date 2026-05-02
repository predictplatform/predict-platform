import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export type MatchStats = {
  match_id: string;
  home: number;   // عدد من توقعوا فوز المضيف
  draw: number;   // عدد من توقعوا تعادل
  away: number;   // عدد من توقعوا فوز الضيف
  total: number;  // إجمالي التوقعات
};

// GET /api/predictions/stats?match_ids=1,2,3
// متاح للجميع بدون مصادقة
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('match_ids') ?? '';
  const matchIds = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (!matchIds.length) return NextResponse.json([]);

  const supabase = createServerSupabaseClient();

  // فقط التوقعات المحسوبة (points_earned IS NOT NULL) — لا نكشف توقعات المباريات الحية
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, home_goals, away_goals')
    .in('match_id', matchIds)
    .not('points_earned', 'is', null);

  if (error) return NextResponse.json([], { status: 500 });

  // تجميع الإحصائيات محلياً
  const map: Record<string, MatchStats> = {};

  for (const id of matchIds) {
    map[id] = { match_id: id, home: 0, draw: 0, away: 0, total: 0 };
  }

  for (const row of data ?? []) {
    const s = map[row.match_id];
    if (!s) continue;
    s.total++;
    if (row.home_goals > row.away_goals) s.home++;
    else if (row.home_goals === row.away_goals) s.draw++;
    else s.away++;
  }

  return NextResponse.json(Object.values(map), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
