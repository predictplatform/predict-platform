import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixtureById } from '@/lib/football-api';
import { calculatePoints } from '@/lib/points';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushSub = { endpoint: string; p256dh: string; auth: string };

async function sendPush(sub: PushSub, payload: object) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    // اشتراك منتهي — احذفه
    if ((err as { statusCode?: number }).statusCode === 410) {
      const supabase = createServerSupabaseClient();
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    }
  }
}

function buildNotificationText(points: number, homeGoals: number, awayGoals: number): string {
  switch (points) {
    case 5: return `🌟 أحسنت! توقعك كان دقيقاً 100% — حصلت 5 نقاط`;
    case 4: return `✅ ممتاز! اتجاه وفارق صح — حصلت 4 نقاط`;
    case 3: return `👍 توقعك كان في الاتجاه الصح — حصلت 3 نقاط`;
    default: return `😅 للأسف توقعك كان خاطئاً — حظاً أوفر!`;
  }
}

// يُستدعى من Vercel Cron Job كل 30 دقيقة
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== process.env.CRON_SECRET) {
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
  let notified = 0;
  const affectedUsers = new Set<string>();

  // نتائج المباريات التي انتهت في هذا الكرون
  type FinishedMatch = {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
  };
  const finishedMatches: FinishedMatch[] = [];

  // حساب النقاط لكل مباراة انتهت
  for (const matchId of matchIds) {
    try {
      const fixture = await getFixtureById(Number(matchId));
      if (!fixture) continue;

      const { short } = fixture.fixture.status;
      if (!['FT', 'AET', 'PEN'].includes(short)) continue;

      const homeGoals = fixture.goals.home ?? 0;
      const awayGoals = fixture.goals.away ?? 0;
      const result = { homeGoals, awayGoals };

      finishedMatches.push({
        matchId,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeGoals,
        awayGoals,
      });

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

        affectedUsers.add(pred.user_id);
        updated++;
      }
    } catch {
      // skip this match
    }
  }

  // تحديث total_points لكل مستخدم متأثر
  for (const userId of Array.from(affectedUsers)) {
    const { data: userPreds } = await supabase
      .from('predictions')
      .select('points_earned')
      .eq('user_id', userId)
      .not('points_earned', 'is', null);

    const total = (userPreds ?? []).reduce(
      (sum: number, p: { points_earned: number }) => sum + (p.points_earned ?? 0),
      0
    );

    await supabase
      .from('profiles')
      .update({ total_points: total })
      .eq('id', userId);
  }

  // إرسال إشعار لكل مستخدم عن كل مباراة توقعها وانتهت
  if (finishedMatches.length > 0) {
    for (const match of finishedMatches) {
      // جلب توقعات هذه المباراة مع نقاطها (بعد التحديث)
      const { data: matchPreds } = await supabase
        .from('predictions')
        .select('user_id, home_goals, away_goals, points_earned')
        .eq('match_id', match.matchId)
        .not('points_earned', 'is', null);

      if (!matchPreds?.length) continue;

      const userIds = matchPreds.map((p: { user_id: string }) => p.user_id);

      // جلب اشتراكات هؤلاء المستخدمين
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, p256dh, auth')
        .in('user_id', userIds);

      if (!subs?.length) continue;

      // إرسال إشعار منفصل لكل مستخدم
      for (const pred of matchPreds as { user_id: string; home_goals: number; away_goals: number; points_earned: number }[]) {
        const userSubs = subs.filter((s: { user_id: string }) => s.user_id === pred.user_id);
        if (!userSubs.length) continue;

        const payload = {
          title: `${match.homeTeam} vs ${match.awayTeam} — ${match.homeGoals}-${match.awayGoals}`,
          body: `توقعك: ${pred.home_goals}-${pred.away_goals} | ${buildNotificationText(pred.points_earned, match.homeGoals, match.awayGoals)}`,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: `result_${match.matchId}_${pred.user_id}`,
          url: '/predict',
        };

        await Promise.allSettled(userSubs.map((s: PushSub) => sendPush(s, payload)));
        notified++;
      }
    }
  }

  return NextResponse.json({ updated, notified, usersUpdated: affectedUsers.size });
}
