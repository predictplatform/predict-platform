import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getFixtureById } from '@/lib/football-api';

// الحالات التي تمنع التوقع (بدأت أو انتهت)
const BLOCKED_STATUSES = new Set([
  '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE',
  'FT', 'AET', 'PEN',
  'SUSP', 'PST', 'CANC', 'ABD', 'AWD', 'WO',
]);

// يضمن وجود profile للمستخدم قبل أي عملية — يُنشئه إن لم يكن موجوداً
async function ensureProfile(userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (existing) return; // موجود مسبقاً

  // جلب بيانات المستخدم من Clerk لإنشاء الـ profile
  const user = await currentUser();
  const username =
    user?.username ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    `user_${userId.slice(-8)}`;

  await supabase.from('profiles').upsert(
    {
      id: userId,
      username,
      avatar_url: user?.imageUrl ?? null,
      total_points: 0,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
}

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
  const { match_id, home_goals, away_goals, league_id } = body;

  if (!match_id || home_goals === undefined || away_goals === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (home_goals < 0 || home_goals > 15 || away_goals < 0 || away_goals > 15) {
    return NextResponse.json({ error: 'Goals must be between 0 and 15' }, { status: 400 });
  }

  // التحقق من حالة المباراة — رفض التوقع إن بدأت أو انتهت
  try {
    const fixture = await getFixtureById(Number(match_id));
    if (fixture) {
      const status = fixture.fixture.status.short;
      if (BLOCKED_STATUSES.has(status)) {
        return NextResponse.json(
          { error: 'انتهى وقت التوقع — المباراة بدأت أو انتهت' },
          { status: 403 }
        );
      }
    }
  } catch {
    // في حال فشل جلب المباراة، نكمل (fail open — لا نمنع بسبب خطأ API)
  }

  const supabase = createServerSupabaseClient();

  // إنشاء profile تلقائياً إن لم يكن موجوداً — يحل مشكلة foreign key
  await ensureProfile(userId);

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, match_id, home_goals, away_goals, league_id: league_id ?? null },
      { onConflict: 'user_id,match_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
