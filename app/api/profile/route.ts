import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET — جلب أو إنشاء profile للمستخدم الحالي
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabaseClient();

  const PROFILE_FIELDS = 'id, username, avatar_url, total_points, favorite_team, profile_complete, created_at';

  let { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();

  // أنشئ profile إن لم يكن موجوداً
  if (!profile) {
    const user = await currentUser();
    const username =
      user?.username ??
      user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
      `user_${userId.slice(-6)}`;

    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        avatar_url: user?.imageUrl ?? null,
        total_points: 0,
      })
      .select(PROFILE_FIELDS)
      .single();

    profile = newProfile;
  }

  return NextResponse.json(profile);
}

// PATCH — تحديث username
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = await req.json();
  if (!username || typeof username !== 'string' || username.length < 3) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ username: username.trim() })
    .eq('id', userId)
    .select('id, username, avatar_url, total_points, favorite_team, profile_complete, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
