import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Season } from '@/lib/supabase';

// الحقول المكشوفة — winner_user_id مستبعد (private)
type PublicSeason = Omit<Season, 'winner_user_id'>;

// GET /api/seasons — قائمة كل المواسم مرتبة من الأحدث للأقدم
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('seasons')
    .select(
      'id, name, name_en, start_date, end_date, is_active, winner_username, winner_adjusted_points, created_at',
    )
    .order('start_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as PublicSeason[], {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
  });
}
