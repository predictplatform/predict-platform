import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixtureById } from '@/lib/football-api';
import { calculatePoints } from '@/lib/points';

// يُستدعى من Vercel Cron Job كل 30 دقيقة
export async function GET(req: NextRequest) {
  // حماية بسيطة
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // جلب التوقعات التي لم تُحسب نقاطها بعد
  const { data: pending, error } = await supabase
    .from('predictions')
    .select('*')
    .is('points_earned', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!pending || pending.length === 0) return NextResponse.json({ updated: 0 });

  // جمع معرفات المباريات الفريدة
  const matchIds = Array.from(new Set(pending.map((p: { match_id: string }) => p.match_id)));
  let updated = 0;

  for (const matchId of matchIds) {
    try {
      const fixture = await getFixtureById(Number(matchId));
      if (!fixture) continue;

      const { short } = fixture.fixture.status;
      if (!['FT', 'AET', 'PEN'].includes(short)) continue;

      const result = {
        homeGoals: fixture.goals.home ?? 0,
        awayGoals: fixture.goals.away ?? 0,
      };

      const matchPredictions = pending.filter((p: { match_id: string }) => p.match_id === matchId);

      for (const pred of matchPredictions) {
        const points = calculatePoints(
          { homeGoals: pred.home_goals, awayGoals: pred.away_goals },
          result
        );

        await supabase
          .from('predictions')
          .update({ points_earned: points })
          .eq('id', pred.id);

        updated++;
      }
    } catch {
      // skip this match
    }
  }

  return NextResponse.json({ updated, total: pending.length });
}
