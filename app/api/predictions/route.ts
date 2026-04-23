import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET — جلب توقعات المستخدم
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('match_id');

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);

  if (matchId) query = query.eq('match_id', matchId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST — حفظ توقع جديد
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { match_id, home_goals, away_goals } = body;

  if (!match_id || home_goals === undefined || away_goals === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (home_goals < 0 || home_goals > 15 || away_goals < 0 || away_goals > 15) {
    return NextResponse.json({ error: 'Goals must be between 0 and 15' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // التأكد إن المباراة لم تبدأ بعد
  // (يمكن إضافة التحقق من API هنا لاحقاً)

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, match_id, home_goals, away_goals },
      { onConflict: 'user_id,match_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
