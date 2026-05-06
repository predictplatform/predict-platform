'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LEAGUES } from '@/lib/football-api';
import { LeagueSelector } from '@/components/LeagueSelector';
import { useT } from '@/hooks/useT';

interface TopScorer {
  player: { id: number; name: string; photo: string; nationality: string };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    goals: { total: number | null; assists: number | null };
    games: { appearences: number | null };
  }>;
}

export default function StatsPage() {
  const t = useT();
  const [selectedLeague, setSelectedLeague] = useState<number>(LEAGUES.SAUDI.id);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?league=${selectedLeague}&season=2024`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setTopScorers(Array.isArray(data) ? data : []);
      } catch {
        setTopScorers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedLeague]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white">{t.stats.title}</h1>
        <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-600/50 px-2 py-1 rounded-full font-semibold">
          {t.stats.season}
        </span>
      </div>

      <LeagueSelector selected={selectedLeague} onChange={id => id !== null && setSelectedLeague(id)} className="mb-6" />

      {loading ? (
        <div className="card animate-pulse h-96 bg-slate-700/50" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="font-bold text-white">{t.stats.topScorers}</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {topScorers.slice(0, 15).map((scorer, i) => {
              const stats = scorer.statistics[0];
              return (
                <div key={scorer.player.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors">
                  <span className={`w-6 text-center font-black text-sm ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <Image
                    src={scorer.player.photo}
                    alt={scorer.player.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{scorer.player.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Image
                        src={stats?.team?.logo ?? ''}
                        alt=""
                        width={14}
                        height={14}
                        unoptimized
                      />
                      <span className="text-xs text-slate-400 truncate">{stats?.team?.name}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-base font-black text-white">
                      {stats?.goals?.total ?? 0}
                      <span className="text-xs text-slate-400 font-normal mr-1">{t.stats.goals}</span>
                    </div>
                    {stats?.goals?.assists ? (
                      <div className="text-xs text-blue-400">
                        {stats.goals.assists} {t.stats.assists}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
