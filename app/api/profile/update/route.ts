import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, favorite_team } = await req.json();

  if (!username || username.trim().length < 3) {
    return NextResponse.json({ error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }, { status: 400 });
  }
  if (username.trim().length > 20) {
    return NextResponse.json({ error: 'اسم المستخدم لا يتجاوز 20 حرفاً' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // تحقق من التكرار
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .neq('id', userId)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'اسم المستخدم مأخوذ، اختر اسماً آخر' }, { status: 409 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: username.trim(),
      favorite_team: favorite_team ?? null,
      profile_complete: true,
    })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
