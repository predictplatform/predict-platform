import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixturesByDate } from '@/lib/football-api';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushSub = { user_id: string; endpoint: string; p256dh: string; auth: string };

async function send(sub: PushSub, payload: object) {
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

// يُستدعى كل 15 دقيقة من Vercel Cron
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();

  let fixtures;
  try {
    fixtures = await getFixturesByDate(today);
  } catch {
    return NextResponse.json({ error: 'API fetch failed' }, { status: 500 });
  }

  const { data: allSubs } = await supabase.from('push_subscriptions').select('*');
  if (!allSubs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const f of fixtures) {
    const matchTime = new Date(f.fixture.date).getTime();
    const minutesUntil = (matchTime - now) / 60000;
    const status = f.fixture.status.short;
    const homeTeam = f.teams.home.name;
    const awayTeam = f.teams.away.name;
    const matchId = String(f.fixture.id);

    // إشعار قبل ساعة (بين 58 و 62 دقيقة)
    if (minutesUntil >= 58 && minutesUntil <= 62) {
      const payload = {
        title: 'مباراة تبدأ بعد ساعة ⚽',
        body: `${homeTeam} vs ${awayTeam} — توقع الآن قبل فوات الأوان!`,
        icon: '/icon-192.png',
        tag: `pre_${matchId}`,
        url: '/predict',
      };
      await Promise.allSettled(allSubs.map((s: PushSub) => send(s, payload)));
      sent += allSubs.length;
    }

    // إشعار بعد انتهاء المباراة — فقط للذين توقعوا
    if (['FT', 'AET', 'PEN'].includes(status)) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id')
        .eq('match_id', matchId)
        .is('points_earned', null); // فقط من لم يروا نقاطهم بعد

      if (preds?.length) {
        const userIds = preds.map((p: { user_id: string }) => p.user_id);
        const targetSubs = allSubs.filter((s: PushSub) => userIds.includes(s.user_id));

        const payload = {
          title: 'انتهت المباراة! 🏁',
          body: `${homeTeam} ${f.goals.home ?? 0} - ${f.goals.away ?? 0} ${awayTeam} — شوف كم نقطة حصلت!`,
          icon: '/icon-192.png',
          tag: `post_${matchId}`,
          url: '/predict',
        };
        await Promise.allSettled(targetSubs.map((s: PushSub) => send(s, payload)));
        sent += targetSubs.length;
      }
    }
  }

  return NextResponse.json({ sent, fixtures: fixtures.length });
}
