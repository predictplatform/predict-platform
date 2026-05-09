import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/admin/end-season
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Body (JSON):
 * {
 *   new_name:       "موسم 2026/27",
 *   new_name_en:    "Season 2026/27",
 *   new_start_date: "2026-08-01"
 * }
 *
 * العملية:
 * 1. التحقق من وجود موسم نشط
 * 2. حساب الفائز (أعلى adjusted_points بحد أدنى 10 توقعات)
 * 3. تحديث الموسم الحالي: is_active=false + بيانات الفائز + end_date
 * 4. إنشاء الموسم الجديد كنشط
 */
export async function POST(req: NextRequest) {
  // ── مصادقة ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { new_name, new_name_en, new_start_date } = body as Record<string, string>;

  if (!new_name || !new_name_en || !new_start_date) {
    return NextResponse.json(
      { error: 'يجب إرسال: new_name, new_name_en, new_start_date' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();

  // ── 1. الموسم النشط الحالي ─────────────────────────────────────────
  const { data: activeSeason, error: seasonError } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single();

  if (seasonError || !activeSeason) {
    return NextResponse.json({ error: 'لا يوجد موسم نشط حالياً' }, { status: 404 });
  }

  // ── 2. جلب التوقعات المحسومة لهذا الموسم ─────────────────────────
  const { data: preds } = await supabase
    .from('predictions')
    .select('user_id, points_earned')
    .eq('season_id', activeSeason.id)
    .not('points_earned', 'is', null);

  // تجميع الإحصاء لكل مستخدم
  const statsMap: Record<string, { settled: number; correct: number; points: number }> = {};
  for (const p of preds ?? []) {
    const uid = p.user_id as string;
    if (!statsMap[uid]) statsMap[uid] = { settled: 0, correct: 0, points: 0 };
    statsMap[uid].settled++;
    statsMap[uid].points += (p.points_earned as number) ?? 0;
    if (((p.points_earned as number) ?? 0) > 0) statsMap[uid].correct++;
  }

  // حساب الفائز — بحد أدنى 10 توقعات محسومة
  const MIN_PREDICTIONS = 10;
  let winnerId: string | null = null;
  let winnerAdjPoints    = 0;

  for (const [userId, s] of Object.entries(statsMap)) {
    if (s.settled < MIN_PREDICTIONS) continue;
    const accuracy = s.settled > 0 ? s.correct / s.settled : 0;
    const adj      = s.points * (1 + accuracy);
    if (adj > winnerAdjPoints) {
      winnerAdjPoints = adj;
      winnerId        = userId;
    }
  }

  // جلب اسم الفائز
  let winnerUsername: string | null = null;
  if (winnerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single();
    winnerUsername = (profile as { username?: string } | null)?.username ?? null;
  }

  // ── 3. إنهاء الموسم الحالي ────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const { error: endError } = await supabase
    .from('seasons')
    .update({
      is_active:              false,
      end_date:               today,
      winner_user_id:         winnerId,
      winner_username:        winnerUsername,
      winner_adjusted_points: winnerId
        ? Math.round(winnerAdjPoints * 100) / 100
        : null,
    })
    .eq('id', activeSeason.id);

  if (endError) {
    return NextResponse.json({ error: endError.message }, { status: 500 });
  }

  // ── 4. إنشاء الموسم الجديد ────────────────────────────────────────
  const { data: newSeason, error: createError } = await supabase
    .from('seasons')
    .insert({
      name:       new_name,
      name_en:    new_name_en,
      start_date: new_start_date,
      is_active:  true,
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({
    success:                 true,
    ended_season_id:         activeSeason.id,
    winner_username:         winnerUsername,
    winner_adjusted_points:  Math.round(winnerAdjPoints * 100) / 100,
    new_season:              newSeason,
  });
}
