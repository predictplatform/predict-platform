'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { MatchCard } from '@/components/MatchCard';
import { LEAGUES, FixtureData, LeagueKey } from '@/lib/football-api';
import { Prediction } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

type FilterStatus = 'all' | 'live' | 'upcoming' | 'finished';

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** بناء قائمة الأيام بناء على offset (0 = البداية من أمس) */
function buildDates(offset: number): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 1 + offset);
    return toLocalISODate(d);
  });
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const initialLeague = searchParams.get('league') ? Number(searchParams.get('league')) : null;
  const { isSignedIn } = useUser();

  const todayStr = toLocalISODate(new Date());
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(initialLeague);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [predMap, setPredMap] = useState<Record<string, Prediction>>({});
  const [dateCounts, setDateCounts] = useState<Record<string, number>>({});

  const dates = buildDates(dateOffset);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // جلب المباريات عند تغيير التاريخ أو الدوري
  useEffect(() => {
    const fetchFixtures = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ date: selectedDate });
        if (selectedLeague) params.set('league', String(selectedLeague));

        const res = await fetch(`/api/matches?${params}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const data: FixtureData[] = await res.json();
        setFixtures(Array.isArray(data) ? data : []);

        if (isSignedIn && data.length > 0) {
          try {
            const predsRes = await fetch('/api/predictions');
            const preds: Prediction[] = await predsRes.json();
            const map: Record<string, Prediction> = {};
            preds.forEach(p => { map[p.match_id] = p; });
            setPredMap(map);
          } catch { /* ignore */ }
        }
      } catch {
        setFixtures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, [selectedDate, selectedLeague, isSignedIn]);

  // جلب عدد المباريات لكل يوم في الشريط (بدون فلتر دوري)
  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.allSettled(
        dates.map(async (date) => {
          const res = await fetch(`/api/matches?date=${date}`, { cache: 'no-store' });
          const data: FixtureData[] = await res.json();
          return { date, count: Array.isArray(data) ? data.length : 0 };
        })
      );
      const counts: Record<string, number> = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') counts[r.value.date] = r.value.count;
      });
      setDateCounts(prev => ({ ...prev, ...counts }));
    };
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateOffset]);

  const filtered = fixtures.filter((f) => {
    const s = f.fixture.status.short;
    if (statusFilter === 'live') return ['1H', 'HT', '2H', 'ET', 'P'].includes(s);
    if (statusFilter === 'upcoming') return s === 'NS';
    if (statusFilter === 'finished') return ['FT', 'AET', 'PEN'].includes(s);
    return true;
  });

  const yesterdayStr = (() => {
    const y = new Date(); y.setDate(y.getDate() - 1); return toLocalISODate(y);
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-6">
      <h1 className="text-2xl font-black text-white mb-4">المباريات</h1>

      {/* ─── Sticky Filters ────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-slate-900 -mx-4 px-4 pb-3">

        {/* شريط التواريخ */}
        <div className="flex items-center gap-1 mb-0">
          {/* سهم يمين (السابق) */}
          <button
            onClick={() => setDateOffset(o => o - 1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors text-lg"
            aria-label="الأيام السابقة"
          >
            ›
          </button>

          {/* الأيام */}
          <div
            ref={dateScrollRef}
            className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none"
          >
            {dates.map((date) => {
              const isToday = date === todayStr;
              const isYesterday = date === yesterdayStr;
              const isSelected = date === selectedDate;
              const d = new Date(date + 'T12:00:00');
              const dayNum = d.getDate();
              const dayName = isToday ? 'اليوم' : isYesterday ? 'أمس' :
                d.toLocaleDateString('ar-SA', { weekday: 'short' });
              const count = dateCounts[date];

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl
                    transition-all duration-200 min-w-[56px]
                    ${isToday && !isSelected
                      ? 'bg-slate-700/80 ring-2 ring-blue-500/50 text-white'
                      : isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <span className={`text-xl font-black leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-400' : 'text-slate-200'
                  }`}>
                    {dayNum}
                  </span>
                  <span className="text-[10px] font-semibold mt-0.5 leading-none">
                    {dayName}
                  </span>
                  {count !== undefined && (
                    <span className={`text-[9px] mt-1 font-bold leading-none ${
                      isSelected ? 'text-blue-200' : count > 0 ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {count > 0 ? count : '—'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* سهم يسار (التالي) */}
          <button
            onClick={() => setDateOffset(o => o + 1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors text-lg"
            aria-label="الأيام القادمة"
          >
            ‹
          </button>
        </div>

        {/* فاصل */}
        <div className="border-t border-slate-700/60 my-3" />

        {/* شريط الدوريات */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {/* الكل */}
          <button
            onClick={() => setSelectedLeague(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors relative ${
              !selectedLeague
                ? 'text-white after:absolute after:bottom-0 after:right-4 after:left-4 after:h-0.5 after:bg-white after:rounded-full'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-base">🌐</span>
            الكل
          </button>

          {/* فاصل رأسي */}
          <div className="w-px h-5 bg-slate-700 mx-1 flex-shrink-0" />

          {(Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][]).map(([, league]) => {
            const isActive = selectedLeague === league.id;
            return (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(isActive ? null : league.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors relative whitespace-nowrap ${
                  isActive
                    ? 'text-white after:absolute after:bottom-0 after:right-3 after:left-3 after:h-0.5 after:bg-blue-400 after:rounded-full'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{league.flag}</span>
                {league.name}
              </button>
            );
          })}
        </div>

        {/* فاصل سفلي */}
        <div className="border-t border-slate-700/40 mt-2" />

        {/* فلتر الحالة */}
        <div className="flex gap-2 pt-3">
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
      </div>

      {/* ─── قائمة المباريات ───────────────────────────────────────────── */}
      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-48 bg-slate-700/50" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((fixture) => (
              <MatchCard
                key={fixture.fixture.id}
                fixture={fixture}
                showPredictButton
                userPrediction={predMap[String(fixture.fixture.id)] ?? null}
              />
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
