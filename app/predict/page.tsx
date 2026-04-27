'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { PredictionCard } from '@/components/PredictionCard';
import { FixtureData, LEAGUES, LeagueKey } from '@/lib/football-api';
import { Prediction } from '@/lib/supabase';
import type { MatchStats } from '@/app/api/predictions/stats/route';
import Link from 'next/link';

export default function PredictPage() {
  const { isSignedIn, isLoaded: authLoaded, user } = useUser();
  const [fixtures,    setFixtures]    = useState<FixtureData[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [matchStats,  setMatchStats]  = useState<Record<string, MatchStats>>({});
  const [loading,     setLoading]     = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<number>(LEAGUES.SAUDI.id);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-predictions'>('upcoming');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fixtureGen = useRef(0); // generation counter للمباريات فقط

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ① جلب التوقعات مرة واحدة عند تحميل الصفحة — مستقلة تماماً عن فلتر الدوري
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    const controller = new AbortController();
    fetch('/api/predictions', { signal: controller.signal })
      .then(r => r.json())
      .then((data: Prediction[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, Prediction> = {};
        data.forEach(p => { map[p.match_id] = p; });
        setPredictions(map);
      })
      .catch(e => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, [authLoaded, isSignedIn]);

  // ② جلب المباريات عند تغيير الدوري — لا تمس التوقعات
  const fetchFixtures = async (leagueId: number, signal: AbortSignal) => {
    const gen = ++fixtureGen.current;
    setLoading(true);
    try {
      const today    = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const params   = `&league=${leagueId}`;

      const [todayRes, tomorrowRes] = await Promise.all([
        fetch(`/api/matches?date=${today}${params}`, { signal }).then(r => r.json()),
        fetch(`/api/matches?date=${tomorrow}${params}`, { signal }).then(r => r.json()),
      ]);

      if (gen !== fixtureGen.current) return;

      const allFixtures: FixtureData[] = [
        ...(Array.isArray(todayRes)    ? todayRes    : []),
        ...(Array.isArray(tomorrowRes) ? tomorrowRes : []),
      ].filter(f =>
        ['NS', '1H', 'HT', '2H', 'ET', 'P', 'FT', 'AET', 'PEN'].includes(f.fixture.status.short)
      );

      setFixtures(allFixtures);

      if (allFixtures.length > 0) {
        const ids = allFixtures.map(f => String(f.fixture.id)).join(',');
        try {
          const statsData: MatchStats[] = await fetch(`/api/predictions/stats?match_ids=${ids}`, { signal }).then(r => r.json());
          if (gen !== fixtureGen.current) return;
          const statsMap: Record<string, MatchStats> = {};
          statsData.forEach(s => { statsMap[s.match_id] = s; });
          setMatchStats(statsMap);
        } catch { /* ignore */ }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (gen !== fixtureGen.current) return;
      setFixtures([]);
    } finally {
      if (gen === fixtureGen.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    const controller = new AbortController();
    fetchFixtures(selectedLeague, controller.signal);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn, selectedLeague]);

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

  if (authLoaded && !isSignedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🔐</p>
        <h1 className="text-2xl font-black text-white mb-3">سجل دخولك للتوقع</h1>
        <p className="text-slate-400 mb-6">يجب تسجيل الدخول لتتمكن من حفظ توقعاتك وتجميع النقاط</p>
        <Link href="/" className="btn-primary px-8 py-3 text-base">
          تسجيل الدخول / إنشاء حساب
        </Link>
      </div>
    );
  }

  const upcomingFixtures     = fixtures.filter(f => f.fixture.status.short === 'NS');
  const myPredictionFixtures = fixtures.filter(f => predictions[String(f.fixture.id)]);

  console.log('[predict] RENDER', {
    loading,
    authLoaded,
    isSignedIn,
    fixturesCount: fixtures.length,
    predictionsKeys: Object.keys(predictions),
    upcomingCount: upcomingFixtures.length,
    upcomingWithPred: upcomingFixtures.filter(f => predictions[String(f.fixture.id)]).map(f => f.fixture.id),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">توقعاتي 🎯</h1>
          {user && (
            <p className="text-slate-400 text-sm mt-1">
              مرحباً {user.firstName ?? user.username}! توقع نتائج المباريات القادمة
            </p>
          )}
        </div>
      </div>

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

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][]).map(([, league]) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
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
