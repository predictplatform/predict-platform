'use client';

import Link from 'next/link';
import { MatchCard } from '@/components/MatchCard';
import { LeagueSelector } from '@/components/LeagueSelector';
import { useT } from '@/hooks/useT';
import type { FixtureData } from '@/lib/football-api';

type PredEntry = { home_goals: number; away_goals: number; points_earned: number | null };

interface HomeClientProps {
  fixtures: FixtureData[];
  predMap: Record<string, PredEntry>;
}

export function HomeClient({ fixtures, predMap }: HomeClientProps) {
  const t = useT();

  const pointsRows = [
    { pts: 5, label: t.home.pts5Label, icon: '⭐', color: 'border-amber-500/50 bg-amber-500/5' },
    { pts: 4, label: t.home.pts4Label, icon: '✅', color: 'border-green-500/50 bg-green-500/5' },
    { pts: 3, label: t.home.pts3Label, icon: '👍', color: 'border-blue-500/50 bg-blue-500/5' },
    { pts: 0, label: t.home.pts0Label, icon: '❌', color: 'border-red-500/50 bg-red-500/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <section className="text-center py-10 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
          {t.home.heroTitle}
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          {t.home.heroSubtitle}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/predict" className="btn-primary text-base px-8 py-3">
            {t.home.predictNow}
          </Link>
          <Link href="/leaderboard" className="btn-secondary text-base px-8 py-3">
            {t.home.leaderboardBtn}
          </Link>
        </div>
      </section>

      {/* نظام النقاط */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">{t.home.pointsSystem}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pointsRows.map(({ pts, label, icon, color }) => (
            <div key={pts} className={`rounded-xl border p-4 text-center ${color}`}>
              <div className="text-3xl font-black text-white">{pts}</div>
              <div className="text-xs text-slate-300 mt-1">{icon} {label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* الدوريات */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">{t.home.availableLeagues}</h2>
        <LeagueSelector hrefBase="/matches?league=" />
      </section>

      {/* مباريات اليوم */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{t.home.todayMatches}</h2>
          <Link href="/matches" className="text-sm text-blue-400 hover:text-blue-300">
            {t.home.viewAll}
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
            <p className="font-semibold">{t.home.noMatchesToday}</p>
            <p className="text-sm mt-1">{t.home.noMatchesHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
