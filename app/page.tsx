import { MatchCard } from '@/components/MatchCard';
import { getFeaturedFixtures, LEAGUES, FixtureData } from '@/lib/football-api';
import { LeagueSelector } from '@/components/LeagueSelector';
import { createServerSupabaseClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <section className="text-center py-10 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
          ⚽ دوري التوقعات
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          توقع المباريات .. جمّع نقاط ونافس اخوياك
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/predict" className="btn-primary text-base px-8 py-3">
            توقع الآن 🎯
          </Link>
          <Link href="/leaderboard" className="btn-secondary text-base px-8 py-3">
            الليدربورد 🏆
          </Link>
        </div>
      </section>

      {/* نظام النقاط */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">نظام النقاط</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { pts: 5, label: 'نتيجة دقيقة 100%', icon: '⭐', color: 'border-amber-500/50 bg-amber-500/5' },
            { pts: 4, label: 'اتجاه + فارق صح', icon: '✅', color: 'border-green-500/50 bg-green-500/5' },
            { pts: 3, label: 'اتجاه صحيح فقط', icon: '👍', color: 'border-blue-500/50 bg-blue-500/5' },
            { pts: 0, label: 'غلط كلياً', icon: '❌', color: 'border-red-500/50 bg-red-500/5' },
          ].map(({ pts, label, icon, color }) => (
            <div key={pts} className={`rounded-xl border p-4 text-center ${color}`}>
              <div className="text-3xl font-black text-white">{pts}</div>
              <div className="text-xs text-slate-300 mt-1">{icon} {label}</div>
            </div>
          ))}
        </div>
      </section>

{/* الدوريات */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">الدوريات المتاحة</h2>
        <LeagueSelector hrefBase="/matches?league=" />
      </section>

      {/* مباريات اليوم */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">مباريات اليوم</h2>
          <Link href="/matches" className="text-sm text-blue-400 hover:text-blue-300">
            عرض الكل ←
          </Link>
        </div>

        {fixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixtures.map((fixture) => (
              <MatchCard
                key={fixture.fixture.id}
                fixture={fixture}
                showPredictButton
                userPrediction={predMap[String(fixture.fixture.id)] ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">⚽</p>
            <p className="font-semibold">لا توجد مباريات اليوم</p>
            <p className="text-sm mt-1">تحقق من صفحة المباريات لأيام أخرى</p>
          </div>
        )}
      </section>
    </div>
  );
}
