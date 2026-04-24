import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerSupabaseClient } from '@/lib/supabase';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushSubscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function sendToSubscription(sub: PushSubscription, payload: object) {
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

export async function POST(req: NextRequest) {
  // حماية — يُستدعى من cron أو من الإدمن فقط
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, fixture } = await req.json();
  // type: 'pre_match' | 'post_match'
  // fixture: { id, homeTeam, awayTeam }

  const supabase = createServerSupabaseClient();

  if (type === 'pre_match') {
    // إشعار قبل المباراة بساعة — لجميع المشتركين
    const { data: subs } = await supabase.from('push_subscriptions').select('*');
    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const payload = {
      title: 'مباراة تبدأ بعد ساعة ⚽',
      body: `${fixture.homeTeam} vs ${fixture.awayTeam} — توقع الآن قبل فوات الأوان!`,
      icon: '/icon-192.png',
      tag: `pre_match_${fixture.id}`,
      url: '/predict',
      actions: [{ action: 'predict', title: '🎯 توقع الآن' }],
    };

    await Promise.allSettled(subs.map((s: PushSubscription) => sendToSubscription(s, payload)));
    return NextResponse.json({ sent: subs.length });
  }

  if (type === 'post_match') {
    // إشعار بعد المباراة — فقط للمستخدمين الذين توقعوا هذه المباراة
    const { data: predictions } = await supabase
      .from('predictions')
      .select('user_id')
      .eq('match_id', String(fixture.id));

    if (!predictions?.length) return NextResponse.json({ sent: 0 });

    const userIds = predictions.map((p: { user_id: string }) => p.user_id);

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const payload = {
      title: 'انتهت المباراة! 🏁',
      body: `${fixture.homeTeam} vs ${fixture.awayTeam} — شوف كم نقطة حصلت!`,
      icon: '/icon-192.png',
      tag: `post_match_${fixture.id}`,
      url: '/predict',
      actions: [{ action: 'view', title: '🏆 شوف النقاط' }],
    };

    await Promise.allSettled(subs.map((s: PushSubscription) => sendToSubscription(s, payload)));
    return NextResponse.json({ sent: subs.length });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
