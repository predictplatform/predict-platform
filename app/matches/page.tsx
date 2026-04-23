'use client';

import { useState, useEffect, Suspense } from 'react';
import { MatchCard } from '@/components/MatchCard';
import { LEAGUES, FixtureData, LeagueKey } from '@/lib/football-api';
import { useSearchParams } from 'next/navigation';

type FilterStatus = 'all' | 'live' | 'upcoming' | 'finished';

// تحويل Date لـ YYYY-MM-DD بتوقيت محلي (لا UTC)
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const initialLeague = searchParams.get('league') ? Number(searchParams.get('league')) : null;

  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(initialLeague);
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    const fetchFixtures = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ date: selectedDate });
        if (selectedLeague) params.set('league', String(selectedLeague));

        // cache: 'no-store' لمنع الـ browser من إعادة الكاش القديم
        const res = await fetch(`/api/matches?${params}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setFixtures(Array.isArray(data) ? data : []);
      } catch {
        setFixtures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, [selectedDate, selectedLeague]);

  const filtered = fixtures.filter((f) => {
    const s = f.fixture.status.short;
    if (statusFilter === 'live') return ['1H', 'HT', '2H', 'ET', 'P'].includes(s);
    if (statusFilter === 'upcoming') return s === 'NS';
    if (statusFilter === 'finished') return ['FT', 'AET', 'PEN'].includes(s);
    return true;
  });

  const todayStr = toLocalISODate(new Date());

  // الأيام: أمس + اليوم + 5 أيام قادمة (7 أيام إجمالاً)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 1);
    return toLocalISODate(d);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white mb-6">المباريات</h1>

      {/* Date Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-1">
        {dates.map((date) => {
          const isToday = date === todayStr;
          const isYesterday = date === (() => {
            const y = new Date(); y.setDate(y.getDate() - 1); return toLocalISODate(y);
          })();
          const d = new Date(date + 'T12:00:00'); // noon لتجنب مشاكل timezone في constructor
          const label = isToday ? 'اليوم' : isYesterday ? 'أمس' :
            d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                selectedDate === date
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* League Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedLeague(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            !selectedLeague ? 'bg-white text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          الكل
        </button>
        {(Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][]).map(([, league]) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id === selectedLeague ? null : league.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              selectedLeague === league.id
                ? `${league.color} text-white`
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {league.flag} {league.name}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {([['all', 'الكل'], ['live', '🔴 مباشر'], ['upcoming', 'القادمة'], ['finished', 'المنتهية']] as [FilterStatus, string][]).map(
          ([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Fixtures Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-slate-700/50" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fixture) => (
            <MatchCard key={fixture.fixture.id} fixture={fixture} showPredictButton />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-semibold">لا توجد مباريات في هذا اليوم</p>
          <p className="text-sm mt-1 text-slate-500">للدوريات المدعومة: روشن، إنجليزي، إسباني، إيطالي، أبطال أوروبا</p>
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-8 w-40 bg-slate-700 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-slate-700/50" />
          ))}
        </div>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
