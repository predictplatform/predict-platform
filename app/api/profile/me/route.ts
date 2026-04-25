import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, favorite_team, profile_complete, total_points')
    .eq('id', userId)
    .single();

  return NextResponse.json(data ?? { profile_complete: false });
}
