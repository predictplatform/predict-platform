import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixtureById, FixtureData } from '@/lib/football-api';
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

  console.log(`[CRON] pending predictions in DB: ${pending?.length ?? 0}`);

  if (!pending || pending.length === 0) return NextResponse.json({ updated: 0 });

  type PredRow = {
    id: string; user_id: string; match_id: string;
    home_goals: number; away_goals: number;
    league_id: number | null; points_earned: number | null;
  };

  // ── جلب كل مباراة مباشرة بـ ID ──────────────────────────────────────────────
  const matchIds = Array.from(new Set(pending.map((p: PredRow) => p.match_id)));
  console.log(`[CRON] unique match IDs to fetch (${matchIds.length}):`, matchIds);

  const fixtureMap = new Map<string, FixtureData>();

  const fetchResults = await Promise.allSettled(
    matchIds.map(id => getFixtureById(Number(id)))
  );

  fetchResults.forEach((result, i) => {
    const id = matchIds[i];
    if (result.status === 'fulfilled' && result.value) {
      const f = result.value;
      console.log(`[CRON] fixture ${id}: status=${f.fixture.status.short} goals=${f.goals.home}-${f.goals.away} teams="${f.teams.home.name} vs ${f.teams.away.name}"`);
      fixtureMap.set(id, f);
    } else if (result.status === 'rejected') {
      console.error(`[CRON] fixture ${id}: FETCH FAILED —`, result.reason);
    } else {
      console.warn(`[CRON] fixture ${id}: API returned null (unknown match_id?)`);
    }
  });

  console.log(`[CRON] fixtures fetched successfully: ${fixtureMap.size}/${matchIds.length}`);
  // ────────────────────────────────────────────────────────────────────────────

  let updated = 0;
  let notified = 0;
  const affectedUsers = new Set<string>();

  type FinishedMatch = {
    matchId: string; homeTeam: string; awayTeam: string;
    homeGoals: number; awayGoals: number;
  };
  const finishedMatches: FinishedMatch[] = [];

  // ─── حساب النقاط لكل التوقعات ────────────────────────────────────────────────
  const predUpdates: Array<PredRow & { points_earned: number }> = [];

  for (const matchId of matchIds) {
    const fixture = fixtureMap.get(matchId);
    if (!fixture) {
      console.log(`[CRON] match ${matchId}: skipped — not in fixtureMap`);
      continue;
    }

    const { short } = fixture.fixture.status;
    if (!['FT', 'AET', 'PEN'].includes(short)) {
      console.log(`[CRON] match ${matchId}: skipped — status is "${short}" (not finished)`);
      continue;
    }

    // تخطى إذا لم تصل النتيجة بعد من الـ API — انتظر الـ cron القادم
    if (fixture.goals.home === null || fixture.goals.away === null) {
      console.warn(`[CRON] match ${matchId}: skipped — goals are null despite status ${short}`);
      continue;
    }

    const homeGoals = fixture.goals.home;
    const awayGoals = fixture.goals.away;

    finishedMatches.push({
      matchId,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeGoals,
      awayGoals,
    });

    const matchPredictions = (pending as PredRow[]).filter(p => p.match_id === matchId);

    for (const pred of matchPredictions) {
      const points = calculatePoints(
        { homeGoals: pred.home_goals, awayGoals: pred.away_goals },
        { homeGoals, awayGoals }
      );
      // نبني الكائن الكامل حتى يعمل upsert بدون مشاكل حقول فارغة
      predUpdates.push({ ...pred, points_earned: points });
      affectedUsers.add(pred.user_id);
      updated++;
    }
  }

  console.log(`[CRON] predictions to update: ${predUpdates.length}, affected users: ${affectedUsers.size}`);

  // ─── Batch 1: تحديث النقاط لكل التوقعات في طلب واحد ─────────────────────────
  if (predUpdates.length > 0) {
    const { error: upsertError } = await supabase
      .from('predictions')
      .upsert(predUpdates, { onConflict: 'id' });
    if (upsertError) console.error('[CRON] upsert predictions error:', upsertError.message);
    else console.log(`[CRON] predictions upserted OK`);
  }

  // ─── Batch 2 + 3: total_points — جلب واحد ثم تحديث واحد لكل المستخدمين ──────
  const affectedUserIds = Array.from(affectedUsers);
  if (affectedUserIds.length > 0) {
    const { data: allUserPreds } = await supabase
      .from('predictions')
      .select('user_id, points_earned')
      .in('user_id', affectedUserIds)
      .not('points_earned', 'is', null);

    // حساب المجموع لكل مستخدم في الذاكرة
    const totalsMap: Record<string, number> = {};
    for (const p of (allUserPreds ?? []) as { user_id: string; points_earned: number }[]) {
      totalsMap[p.user_id] = (totalsMap[p.user_id] ?? 0) + p.points_earned;
    }

    // upsert واحد لكل الـ profiles
    const profileUpdates = Object.entries(totalsMap).map(([id, total_points]) => ({ id, total_points }));
    await supabase
      .from('profiles')
      .upsert(profileUpdates, { onConflict: 'id' });
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

  console.log(`[CRON] DONE — updated=${updated} notified=${notified} usersUpdated=${affectedUsers.size}`);
  return NextResponse.json({ updated, notified, usersUpdated: affectedUsers.size });
}
