'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/hooks/useT';

type SeasonSummary = {
  id:                     string;
  name:                   string;
  name_en:                string;
  start_date:             string;
  end_date:               string | null;
  is_active:              boolean;
  winner_username:        string | null;
  winner_adjusted_points: number | null;
};

export default function SeasonsPage() {
  const t    = useT();
  const isAr = t.dir === 'rtl';

  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seasons')
      .then(r => r.json())
      .then((data: unknown) => setSeasons(Array.isArray(data) ? (data as SeasonSummary[]) : []))
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return isAr ? 'جارٍ' : 'Ongoing';
    return new Date(dateStr).toLocaleDateString(t.locale, {
      year:  'numeric',
      month: 'long',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* التنقل */}
      <div className="mb-5">
        <Link
          href="/leaderboard"
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
        >
          {isAr ? '← الليدربورد' : '← Leaderboard'}
        </Link>
      </div>

      {/* العنوان */}
      <h1 className="text-2xl font-black text-white mb-1">
        {isAr ? 'أرشيف المواسم 📅' : 'Season Archive 📅'}
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        {isAr
          ? 'جميع المواسم مع الفائزين والترتيب التاريخي'
          : 'All seasons with their champions and historical rankings'}
      </p>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card animate-pulse h-28 bg-slate-700/50" />
          ))}
        </div>

      ) : seasons.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          {isAr ? 'لا توجد مواسم بعد' : 'No seasons yet'}
        </div>

      ) : (
        <div className="space-y-4">
          {seasons.map((season, idx) => (
            <div
              key={season.id}
              className={`
                card p-5
                ${season.is_active
                  ? 'border border-blue-500/40 bg-blue-900/10'
                  : idx === 0 && !seasons[0]?.is_active
                    ? 'border border-amber-600/30'
                    : ''}
              `}
            >
              <div className="flex items-start justify-between gap-4">

                {/* معلومات الموسم */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {season.is_active && (
                      <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        {isAr ? 'جارٍ' : 'Current'}
                      </span>
                    )}
                    {!season.is_active && idx === 0 && (
                      <span className="text-xs font-bold bg-amber-700/60 text-amber-300 px-2 py-0.5 rounded-full">
                        {isAr ? 'الأحدث' : 'Latest'}
                      </span>
                    )}
                    <h2 className="text-lg font-black text-white">
                      {isAr ? season.name : season.name_en}
                    </h2>
                  </div>

                  {/* التواريخ */}
                  <p className="text-xs text-slate-400">
                    {formatDate(season.start_date)}
                    <span className="mx-1.5 text-slate-600">—</span>
                    {season.end_date
                      ? formatDate(season.end_date)
                      : (isAr ? 'حتى الآن' : 'Present')}
                  </p>

                  {/* رابط الليدربورد إذا كان نشطاً */}
                  {season.is_active && (
                    <Link
                      href="/leaderboard"
                      className="inline-block mt-2 text-xs text-blue-400 hover:underline font-semibold"
                    >
                      {isAr ? 'عرض الترتيب الحالي ←' : 'View Current Standings →'}
                    </Link>
                  )}
                </div>

                {/* الفائز */}
                {season.winner_username ? (
                  <div className="text-right shrink-0">
                    <div className="text-3xl mb-1">🏆</div>
                    <Link
                      href={`/u/${encodeURIComponent(season.winner_username)}`}
                      className="text-amber-400 font-bold text-sm hover:underline block"
                    >
                      {season.winner_username}
                    </Link>
                    {season.winner_adjusted_points != null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {season.winner_adjusted_points.toFixed(1)}{' '}
                        {isAr ? 'نقطة' : 'pts'}
                      </p>
                    )}
                  </div>
                ) : season.is_active ? (
                  <div className="shrink-0 text-right">
                    <div className="text-2xl mb-1">⏳</div>
                    <p className="text-xs text-slate-400 max-w-[90px]">
                      {isAr ? 'الموسم لم ينته بعد' : 'Season in progress'}
                    </p>
                  </div>
                ) : (
                  <div className="shrink-0 text-xs text-slate-500">
                    {isAr ? 'لم يُحدد فائز' : 'No winner recorded'}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
