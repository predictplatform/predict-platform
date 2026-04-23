import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Webhook من Clerk — ينشئ profile عند تسجيل مستخدم جديد
// يجب إضافة CLERK_WEBHOOK_SECRET في .env.local
// وضبطه في Clerk Dashboard > Webhooks

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data } = body;

  if (type !== 'user.created') {
    return NextResponse.json({ received: true });
  }

  const userId: string = data.id;
  const username: string =
    data.username ??
    data.email_addresses?.[0]?.email_address?.split('@')[0] ??
    `user_${userId.slice(-6)}`;

  const avatarUrl: string | null = data.image_url ?? null;

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
