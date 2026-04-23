'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { LEAGUES, LeagueKey } from '@/lib/football-api';

interface TopScorer {
  player: { id: number; name: string; photo: string; nationality: string };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    goals: { total: number | null; assists: number | null };
    games: { appearences: number | null };
  }>;
}

export default function StatsPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(LEAGUES.SAUDI.id);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // season=2024 = موسم 2024/25 (الأحدث المتاح في الخطة المجانية)
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

  const currentLeague = Object.values(LEAGUES).find(l => l.id === selectedLeague);

  const chartData = topScorers.slice(0, 10).map(s => ({
    name: s.player.name.split(' ').slice(-1)[0], // اسم مختصر
    goals: s.statistics[0]?.goals?.total ?? 0,
    assists: s.statistics[0]?.goals?.assists ?? 0,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white">الإحصائيات 📊</h1>
        <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-600/50 px-2 py-1 rounded-full font-semibold">
          موسم 2024/25
        </span>
      </div>

      {/* League Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][]).map(([, league]) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              selectedLeague === league.id
                ? `${league.color} text-white scale-105`
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {league.flag} {league.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-slate-700/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="card">
            <h2 className="font-bold text-white mb-4">
              أفضل الهدافين — {currentLeague?.name}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#e2e8f0', fontSize: 11 }}
                  width={70}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="goals" name="أهداف" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Scorers List */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="font-bold text-white">ترتيب الهدافين</h2>
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
                        <span className="text-xs text-slate-400 font-normal mr-1">هدف</span>
                      </div>
                      {stats?.goals?.assists ? (
                        <div className="text-xs text-blue-400">
                          {stats.goals.assists} تمريرة
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
