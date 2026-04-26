import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixturesByDate, getHistoricalFixtures, FixtureData } from '@/lib/football-api';
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
    if ((err as { statusCode?: number }).statusCode === 410) {
      const supabase = createServerSupabaseClient();
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    }
  }
}

function buildNotificationText(points: number): string {
  switch (points) {
    case 5: return `🌟 أحسنت! توقعك كان دقيقاً 100% — حصلت 5 نقاط`;
    case 4: return `✅ ممتاز! اتجاه وفارق صح — حصلت 4 نقاط`;
    case 3: return `👍 توقعك كان في الاتجاه الصح — حصلت 3 نقاط`;
    default: return `😅 للأسف توقعك كان خاطئاً — حظاً أوفر!`;
  }
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

  // ── جلب المباريات بالتاريخ لا بالـ ID ──────────────────────────────────────
  // اليوم      → getFixturesByDate    (30 دق cache) — مشترك مع طلبات المستخدمين
  // أيام سابقة → getHistoricalFixtures (ساعتان cache) — مباريات انتهت بالفعل
  const today = new Date();
  const todayStr = toDateStr(today);

  const fixtureMap = new Map<string, FixtureData>();

  // اليوم (30 دق cache)
  try {
    const fixtures = await getFixturesByDate(todayStr);
    fixtures.forEach(f => fixtureMap.set(String(f.fixture.id), f));
  } catch { /* skip */ }

  // آخر 3 أيام (ساعتان cache) — للتوقعات التي لم تُحسب بعد
  await Promise.allSettled(
    Array.from({ length: 3 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (i + 1));
      return toDateStr(d);
    }).map(async (date) => {
      try {
        const fixtures = await getHistoricalFixtures(date);
        fixtures.forEach(f => fixtureMap.set(String(f.fixture.id), f));
      } catch { /* skip */ }
    })
  );
  // ────────────────────────────────────────────────────────────────────────────

  const matchIds = Array.from(new Set(pending.map((p: { match_id: string }) => p.match_id)));
  let updated = 0;
  let notified = 0;
  const affectedUsers = new Set<string>();

  type FinishedMatch = {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
  };
  const finishedMatches: FinishedMatch[] = [];

  for (const matchId of matchIds) {
    const fixture = fixtureMap.get(matchId);
    if (!fixture) continue; // مباراة قبل 4 أيام أو غير موجودة في النطاق

    const { short } = fixture.fixture.status;
    if (!['FT', 'AET', 'PEN'].includes(short)) continue;

    const homeGoals = fixture.goals.home ?? 0;
    const awayGoals = fixture.goals.away ?? 0;

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
        { homeGoals, awayGoals }
      );

      await supabase
        .from('predictions')
        .update({ points_earned: points })
        .eq('id', pred.id);

      affectedUsers.add(pred.user_id);
      updated++;
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

  // إرسال إشعار لكل مستخدم
  for (const match of finishedMatches) {
    const { data: matchPreds } = await supabase
      .from('predictions')
      .select('user_id, home_goals, away_goals, points_earned')
      .eq('match_id', match.matchId)
      .not('points_earned', 'is', null);

    if (!matchPreds?.length) continue;

    const userIds = matchPreds.map((p: { user_id: string }) => p.user_id);
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (!subs?.length) continue;

    for (const pred of matchPreds as { user_id: string; home_goals: number; away_goals: number; points_earned: number }[]) {
      const userSubs = subs.filter((s: { user_id: string }) => s.user_id === pred.user_id);
      if (!userSubs.length) continue;

      const payload = {
        title: `${match.homeTeam} vs ${match.awayTeam} — ${match.homeGoals}-${match.awayGoals}`,
        body: `توقعك: ${pred.home_goals}-${pred.away_goals} | ${buildNotificationText(pred.points_earned)}`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: `result_${match.matchId}_${pred.user_id}`,
        url: '/predict',
      };

      await Promise.allSettled(userSubs.map((s: PushSub) => sendPush(s, payload)));
      notified++;
    }
  }

  return NextResponse.json({ updated, notified, usersUpdated: affectedUsers.size });
}
