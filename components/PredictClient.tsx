'use client';

import { useState, useEffect, useCallback } from 'react';
import { PredictionCard } from './PredictionCard';
import { FixtureData, LEAGUES, LeagueKey } from '@/lib/football-api';
import { Prediction } from '@/lib/supabase';
import type { MatchStats } from '@/app/api/predictions/stats/route';

interface Props {
  initialFixtures: FixtureData[];
  initialPredictions: Record<string, Prediction>;
  initialMatchStats: Record<string, MatchStats>;
  displayName: string;
}

export function PredictClient({
  initialFixtures,
  initialPredictions,
  initialMatchStats,
  displayName,
}: Props) {
  const [fixtures,    setFixtures]    = useState<FixtureData[]>(initialFixtures);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(initialPredictions);
  const [matchStats,  setMatchStats]  = useState<Record<string, MatchStats>>(initialMatchStats);
  const [loading,     setLoading]     = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-predictions'>('upcoming');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // فلتر الدوريات — يُعيد جلب المباريات client-side فقط عند تغيير الدوري
  const fetchByLeague = useCallback(async (leagueId: number | null) => {
    setLoading(true);
    try {
      const today    = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const params   = leagueId ? `&league=${leagueId}` : '';

      const [todayRes, tomorrowRes] = await Promise.allSettled([
        fetch(`/api/matches?date=${today}${params}`).then(r => r.json()),
        fetch(`/api/matches?date=${tomorrow}${params}`).then(r => r.json()),
      ]);

      const all: FixtureData[] = [
        ...(todayRes.status    === 'fulfilled' ? todayRes.value    : []),
        ...(tomorrowRes.status === 'fulfilled' ? tomorrowRes.value : []),
      ].filter((f: FixtureData) =>
        ['NS', '1H', 'HT', '2H', 'ET', 'P', 'FT', 'AET', 'PEN'].includes(f.fixture.status.short)
      );

      setFixtures(all);

      if (all.length > 0) {
        const ids = all.map((f: FixtureData) => String(f.fixture.id)).join(',');
        try {
          const statsRes  = await fetch(`/api/predictions/stats?match_ids=${ids}`);
          const statsData: MatchStats[] = await statsRes.json();
          const map: Record<string, MatchStats> = {};
          statsData.forEach(s => { map[s.match_id] = s; });
          setMatchStats(map);
        } catch { /* ignore */ }
      }
    } catch {
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // تغيير الدوري
  const handleLeagueChange = (leagueId: number | null) => {
    setSelectedLeague(leagueId);
    fetchByLeague(leagueId);
  };

  // عند أول تحميل: اجلب مباريات وتوقعات fresh من الـ API مباشرة
  useEffect(() => {
    fetchByLeague(null);
    fetch('/api/predictions')
      .then(r => r.json())
      .then((data: Prediction[]) => {
        const map: Record<string, Prediction> = {};
        data.forEach(p => { map[p.match_id] = p; });
        setPredictions(map);
      })
      .catch(() => { /* ignore */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تقديم توقع
  const handleSubmit = async (matchId: string, homeGoals: number, awayGoals: number, leagueId: number) => {
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, home_goals: homeGoals, away_goals: awayGoals, league_id: leagueId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const saved: Prediction = await res.json();
      setPredictions(prev => ({ ...prev, [matchId]: saved }));
      showToast('تم حفظ توقعك بنجاح ✓', 'success');
    } catch (e) {
      showToast(`حدث خطأ: ${e instanceof Error ? e.message : 'حاول مجدداً'}`, 'error');
      throw e;
    }
  };

  const upcomingFixtures      = fixtures.filter(f => f.fixture.status.short === 'NS');
  const myPredictionFixtures  = fixtures.filter(f => predictions[String(f.fixture.id)]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">توقعاتي 🎯</h1>
          {displayName && (
            <p className="text-slate-400 text-sm mt-1">
              مرحباً {displayName}! توقع نتائج المباريات القادمة
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          المباريات القادمة ({upcomingFixtures.length})
        </button>
        <button
          onClick={() => setActiveTab('my-predictions')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'my-predictions' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          توقعاتي السابقة ({Object.keys(predictions).length})
        </button>
      </div>

      {/* League Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => handleLeagueChange(null)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            !selectedLeague ? 'bg-white text-black' : 'bg-slate-700 text-slate-300'
          }`}
        >
          الكل
        </button>
        {(Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][]).map(([, league]) => (
          <button
            key={league.id}
            onClick={() => handleLeagueChange(selectedLeague === league.id ? null : league.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              selectedLeague === league.id
                ? `${league.color} text-white`
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {league.flag} {league.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-56 bg-slate-700/50" />
          ))}
        </div>
      ) : activeTab === 'upcoming' ? (
        upcomingFixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingFixtures.map(fixture => (
              <PredictionCard
                key={`${fixture.fixture.id}-${predictions[String(fixture.fixture.id)] ? 'predicted' : 'open'}`}
                fixture={fixture}
                existingPrediction={predictions[String(fixture.fixture.id)] ?? null}
                onSubmit={handleSubmit}
                stats={matchStats[String(fixture.fixture.id)] ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold">لا توجد مباريات قادمة للتوقع حالياً</p>
          </div>
        )
      ) : (
        myPredictionFixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPredictionFixtures.map(fixture => (
              <PredictionCard
                key={`${fixture.fixture.id}-${predictions[String(fixture.fixture.id)] ? 'predicted' : 'open'}`}
                fixture={fixture}
                existingPrediction={predictions[String(fixture.fixture.id)] ?? null}
                onSubmit={handleSubmit}
                stats={matchStats[String(fixture.fixture.id)] ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-semibold">لم تسجل أي توقعات بعد</p>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="mt-4 btn-primary text-sm px-6 py-2"
            >
              ابدأ التوقع الآن
            </button>
          </div>
        )
      )}
    </div>
  );
}
