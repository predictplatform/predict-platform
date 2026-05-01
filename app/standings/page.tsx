'use client';

import { useState, useEffect } from 'react';
import { StandingsTable } from '@/components/StandingsTable';
import { LEAGUES } from '@/lib/football-api';
import { LeagueSelector } from '@/components/LeagueSelector';

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(LEAGUES.SAUDI.id);
  const [standings, setStandings] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      try {
        // season=2024 = موسم 2024/25 (الأحدث المتاح في الخطة المجانية)
        const res = await fetch(`/api/standings?league=${selectedLeague}&season=2024`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setStandings(Array.isArray(data) ? data : []);
      } catch {
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [selectedLeague]);

  const currentLeague = Object.values(LEAGUES).find(l => l.id === selectedLeague);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white">جدول الترتيب</h1>
        <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-600/50 px-2 py-1 rounded-full font-semibold">
          موسم 2025/26
        </span>
      </div>

      <LeagueSelector selected={selectedLeague} onChange={id => id !== null && setSelectedLeague(id)} className="mb-6" />

      {/* Table */}
      {loading ? (
        <div className="card animate-pulse h-96 bg-slate-700/50" />
      ) : standings.length > 0 ? (
        <StandingsTable
          standings={standings as Parameters<typeof StandingsTable>[0]['standings']}
          leagueName={currentLeague?.name ?? ''}
        />
      ) : (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold">الترتيب غير متاح حالياً</p>
        </div>
      )}
    </div>
  );
}
