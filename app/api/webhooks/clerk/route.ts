import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServerSupabaseClient } from '@/lib/supabase';

// Webhook من Clerk — ينشئ profile عند تسجيل مستخدم جديد
// يجب إضافة CLERK_WEBHOOK_SECRET في .env.local
// وضبطه في Clerk Dashboard > Webhooks > Signing Secret

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // قراءة الجسم كـ raw text للتحقق من التوقيع
  const body = await req.text();

  const svix_id        = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // التحقق من التوقيع
  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const { type, data } = evt;

  if (type !== 'user.created') {
    return NextResponse.json({ received: true });
  }

  const userId: string   = data.id as string;
  const username: string =
    (data.username as string | undefined) ??
    ((data.email_addresses as Array<{ email_address: string }> | undefined)?.[0]?.email_address?.split('@')[0]) ??
    `user_${userId.slice(-6)}`;

  const avatarUrl: string | null = (data.image_url as string | null) ?? null;

  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username,
      avatar_url: avatarUrl,
      total_points: 0,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('Webhook profile create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}
