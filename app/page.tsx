import { getFeaturedFixtures, FixtureData } from '@/lib/football-api';
import { createServerSupabaseClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { HomeClient } from '@/components/HomeClient';

export default async function HomePage() {
  let fixtures: FixtureData[] = [];
  try {
    const raw = await getFeaturedFixtures();
    fixtures = raw as FixtureData[];
  } catch {
    // API error — show empty state
  }

  // جلب توقعات المستخدم الحالي إن كان مسجلاً
  const { userId } = await auth();
  const predMap: Record<string, { home_goals: number; away_goals: number; points_earned: number | null }> = {};

  if (userId && fixtures.length > 0) {
    const matchIds = fixtures.map(f => String(f.fixture.id));
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('predictions')
      .select('match_id, home_goals, away_goals, points_earned')
      .eq('user_id', userId)
      .in('match_id', matchIds);
    (data ?? []).forEach(p => { predMap[p.match_id] = p; });
  }

  return <HomeClient fixtures={fixtures} predMap={predMap} />;
}
