import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint, p256dh, auth: authKey } = await req.json();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // تأكد من وجود profile أولاً
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
  if (!existing) {
    const user = await currentUser();
    const username =
      user?.username ??
      user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
      `user_${userId.slice(-8)}`;
    await supabase.from('profiles').upsert(
      { id: userId, username, avatar_url: user?.imageUrl ?? null, total_points: 0 },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint, p256dh, auth: authKey },
    { onConflict: 'user_id,endpoint', ignoreDuplicates: false }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await req.json();
  const supabase = createServerSupabaseClient();

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  return NextResponse.json({ ok: true });
}
