'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { FixtureData, LEAGUES } from '@/lib/football-api';
import { Prediction } from '@/lib/supabase';
import { getPointsLabel, getPointsColor } from '@/lib/points';

type EnrichedPrediction = Prediction & {
  fixture: FixtureData | null;
};

function pointsBg(p: number | null): string {
  if (p === null) return 'bg-slate-700/60 text-slate-400';
  if (p === 5)    return 'bg-amber-500/20 text-amber-400';
  if (p >= 3)     return 'bg-green-500/20 text-green-400';
  return 'bg-slate-700/60 text-slate-400';
}

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems]     = useState<EnrichedPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const load = async () => {
      setLoading(true);
      try {
        // 1) جلب كل التوقعات
        const predsRes = await fetch('/api/predictions');
        const preds: Prediction[] = await predsRes.json();
        if (!Array.isArray(preds) || preds.length === 0) {
          setItems([]);
          return;
        }

        // ترتيب: الأحدث أولاً
        const sorted = [...preds].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // 2) جلب بيانات المباريات دفعةً واحدة
        const ids = sorted.map(p => p.match_id).join(',');
        const fixturesRes = await fetch(`/api/matches/batch?ids=${ids}`);
        const fixturesArr: FixtureData[] = await fixturesRes.json();
        const fixtureMap = new Map<string, FixtureData>(
          (Array.isArray(fixturesArr) ? fixturesArr : []).map(f => [String(f.fixture.id), f])
        );

        setItems(sorted.map(p => ({ ...p, fixture: fixtureMap.get(p.match_id) ?? null })));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🔐</p>
        <h1 className="text-2xl font-black text-white mb-3">سجل دخولك أولاً</h1>
        <Link href="/" className="btn-primary px-8 py-3">تسجيل الدخول</Link>
      </div>
    );
  }

  const settled = items.filter(i => i.points_earned !== null);
  const totalPoints = settled.reduce((s, i) => s + (i.points_earned ?? 0), 0);
  const correct = settled.filter(i => (i.points_earned ?? 0) > 0).length;
  const accuracy = settled.length > 0 ? Math.round((correct / settled.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">سجل توقعاتي 📋</h1>
          <p className="text-slate-400 text-sm mt-1">كل توقعاتك السابقة مع النتائج والنقاط</p>
        </div>
        <Link href="/predict" className="text-xs text-slate-400 hover:text-white transition-colors">
          ← التوقعات
        </Link>
      </div>

      {/* ملخص سريع */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-3">
            <p className="text-2xl font-black text-white">{items.length}</p>
            <p className="text-xs text-slate-400 mt-1">إجمالي التوقعات</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-black text-amber-400">{totalPoints}</p>
            <p className="text-xs text-slate-400 mt-1">النقاط المكتسبة</p>
          </div>
          <div className="card text-center py-3">
            <p className={`text-2xl font-black ${
              accuracy >= 60 ? 'text-green-400' : accuracy >= 40 ? 'text-amber-400' : 'text-slate-300'
            }`}>{accuracy}%</p>
            <p className="text-xs text-slate-400 mt-1">نسبة الدقة</p>
          </div>
        </div>
      )}

      {/* القائمة */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-slate-700/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold">لم تسجل أي توقعات بعد</p>
          <Link href="/predict" className="mt-4 btn-primary text-sm px-6 py-2 inline-block">
            توقع الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const f = item.fixture;
            const leagueInfo = f ? Object.values(LEAGUES).find(l => l.id === f.league.id) : null;
            const isFinished = f ? ['FT', 'AET', 'PEN'].includes(f.fixture.status.short) : false;
            const dateStr = new Date(item.created_at).toLocaleDateString('ar-SA', {
              month: 'short', day: 'numeric',
            });

            return (
              <div key={item.id} className="card border border-slate-700/60">
                {/* Header صف */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {f && (
                      <Image src={f.league.logo} alt="" width={14} height={14} unoptimized />
                    )}
                    <span className="text-xs text-slate-400 font-semibold">
                      {leagueInfo?.name ?? (f?.league.name ?? `#${item.match_id}`)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{dateStr}</span>
                </div>

                {f ? (
                  <div className="flex items-center gap-3">
                    {/* الفريق المضيف */}
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <Image src={f.teams.home.logo} alt="" width={24} height={24} unoptimized className="object-contain shrink-0" />
                      <span className="text-xs font-bold text-white truncate">{f.teams.home.name}</span>
                    </div>

                    {/* النتائج */}
                    <div className="flex flex-col items-center shrink-0 gap-1 min-w-[120px]">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <span className="text-white tabular-nums">
                          {item.home_goals} - {item.away_goals}
                        </span>
                        {isFinished && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className="text-blue-300 tabular-nums">
                              {f.goals.home ?? '–'} - {f.goals.away ?? '–'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 text-[9px] text-slate-500">
                        <span>توقعك</span>
                        {isFinished && <><span>|</span><span>النتيجة</span></>}
                      </div>
                    </div>

                    {/* الفريق الضيف */}
                    <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate text-right">{f.teams.away.name}</span>
                      <Image src={f.teams.away.logo} alt="" width={24} height={24} unoptimized className="object-contain shrink-0" />
                    </div>
                  </div>
                ) : (
                  /* لو ما رجعت بيانات المباراة */
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">توقعك: {item.home_goals} - {item.away_goals}</span>
                  </div>
                )}

                {/* النقاط */}
                <div className="mt-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${pointsBg(item.points_earned)}`}>
                    {item.points_earned !== null
                      ? `+${item.points_earned} — ${getPointsLabel(item.points_earned)}`
                      : 'في انتظار نتيجة المباراة ⏳'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
