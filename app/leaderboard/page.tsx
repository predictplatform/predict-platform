'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LeaderboardTable } from '@/components/Leaderboard';
import { LeagueSelector } from '@/components/LeagueSelector';
import { SeasonSelector } from '@/components/SeasonSelector';
import type { SeasonOption } from '@/components/SeasonSelector';
import type { LeaderboardEntry } from '@/app/api/leaderboard/route';
import { useT } from '@/hooks/useT';

// ── Accordion: كيف تُحسب النقاط ─────────────────────────────────────────────
function PointsAccordion() {
  const t = useT();
  const lb = t.leaderboard;
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/70 hover:bg-slate-700/60 transition-colors text-sm font-bold text-slate-200"
      >
        <span className="flex items-center gap-2">
          <span>🧮</span>
          {lb.pointsAccordionTitle}
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="bg-slate-800/40 px-4 py-4 space-y-5 text-sm">

          {/* النقاط الأساسية */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              {lb.pointsBasicTitle}
            </p>
            <div className="space-y-2">
              {(lb.pointsRows as readonly { icon: string; pts: string; label: string; example: string }[]).map((row, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-700/40 px-3 py-2">
                  <span className="text-base shrink-0">{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-semibold">{row.label}</span>
                    {row.example && (
                      <p className="text-slate-400 text-xs mt-0.5">{row.example}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-black text-amber-400 text-base">{row.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* النقاط المعدّلة */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              {lb.pointsAdjTitle}
            </p>
            <div className="rounded-lg bg-blue-900/30 border border-blue-700/30 px-3 py-3 space-y-1.5">
              <p className="text-blue-300 font-bold text-xs">{lb.pointsAdjFormula}</p>
              <p className="text-slate-300 text-xs">{lb.pointsAdjExample}</p>
              <p className="text-slate-400 text-xs border-t border-slate-700/50 pt-1.5 mt-1.5">{lb.pointsAdjDesc}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const t = useT();
  const lb = t.leaderboard;
  const { user, isLoaded } = useUser();

  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null); // null = الموسم النشط
  const [seasons,        setSeasons]        = useState<SeasonOption[]>([]);

  const [qualified,  setQualified]  = useState<LeaderboardEntry[]>([]);
  const [qualifying, setQualifying] = useState<LeaderboardEntry[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── جلب قائمة المواسم مرة واحدة ────────────────────────────────────
  useEffect(() => {
    fetch('/api/seasons')
      .then(r => r.json())
      .then((data: SeasonOption[]) => setSeasons(Array.isArray(data) ? data : []))
      .catch(() => setSeasons([]));
  }, []);

  // ── جلب الليدربورد عند تغيير الدوري أو الموسم ─────────────────────
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedLeague !== null) params.set('league_id', String(selectedLeague));
        if (selectedSeason !== null) params.set('season_id',  selectedSeason);
        // null = الموسم النشط → لا نرسل season_id والـ API يستخدم الافتراضي

        const res  = await fetch(`/api/leaderboard?${params}`);
        const data = await res.json();

        setQualified(data.qualified   ?? []);
        setQualifying(data.qualifying ?? []);
      } catch {
        setQualified([]);
        setQualifying([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedLeague, selectedSeason]);

  const myRank = qualified.findIndex(e => e.id === user?.id) + 1;
  const MIN    = selectedLeague !== null ? 5 : 10;

  // عنوان الموسم المختار لعرضه
  const activeSeason   = seasons.find(s => s.is_active);
  const isAr           = t.dir === 'rtl';
  const seasonLabel    = selectedSeason === 'all'
    ? (isAr ? '🌐 كل المواسم' : '🌐 All Seasons')
    : selectedSeason
      ? (seasons.find(s => s.id === selectedSeason)?.[isAr ? 'name' : 'name_en'] ?? '')
      : (activeSeason?.[isAr ? 'name' : 'name_en'] ?? '');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* بانر الزائر غير المسجل */}
      {isLoaded && !user && (
        <div className="flex items-center justify-between gap-3 bg-blue-600/20 border border-blue-500/40 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm font-bold text-blue-300">{lb.guestBanner}</p>
          <Link
            href="/sign-up"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-black px-4 py-2 rounded-lg"
          >
            {lb.guestBtn}
          </Link>
        </div>
      )}

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">{lb.title}</h1>
          {seasonLabel && (
            <p className="text-xs text-slate-400 mt-0.5">{seasonLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {myRank > 0 && (
            <div className="card py-2 px-4 text-sm">
              <span className="text-slate-400">{lb.yourRank} </span>
              <span className="font-black text-blue-400 text-lg">#{myRank}</span>
            </div>
          )}
          {/* رابط الأرشيف */}
          <Link
            href="/seasons"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            title={isAr ? 'أرشيف المواسم' : 'Season Archive'}
          >
            📅
          </Link>
        </div>
      </div>

      {/* نظام النقاط — Accordion */}
      <PointsAccordion />

      {/* فلتر الموسم */}
      {seasons.length > 0 && (
        <SeasonSelector
          seasons={seasons}
          selected={selectedSeason}
          onChange={setSelectedSeason}
          className="mb-3"
        />
      )}

      {/* تصنيفات الدوريات */}
      <LeagueSelector
        selected={selectedLeague}
        onChange={setSelectedLeague}
        withAll
        allLabel={lb.allLabel}
        className="mb-6"
      />

      {/* Podium — أفضل 3 */}
      {!loading && qualified.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* المركز الثاني */}
          <Link href={`/u/${encodeURIComponent(qualified[1]?.username ?? '')}`}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-xl font-black text-slate-200">
              {qualified[1]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-semibold max-w-[60px] text-center truncate">
              {qualified[1]?.username}
            </span>
            <div className="bg-slate-600 rounded-t-lg w-16 h-16 flex flex-col items-center justify-center">
              <span className="text-xl">🥈</span>
              <span className="text-xs font-bold text-slate-300">
                {qualified[1]?.adjusted_points.toFixed(1)}
              </span>
            </div>
          </Link>

          {/* المركز الأول */}
          <Link href={`/u/${encodeURIComponent(qualified[0]?.username ?? '')}`}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-2xl font-black text-white">
              {qualified[0]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-amber-400 font-bold max-w-[70px] text-center truncate">
              {qualified[0]?.username}
            </span>
            <div className="bg-amber-600 rounded-t-lg w-20 h-24 flex flex-col items-center justify-center">
              <span className="text-2xl">🥇</span>
              <span className="text-sm font-black text-white">
                {qualified[0]?.adjusted_points.toFixed(1)}
              </span>
            </div>
          </Link>

          {/* المركز الثالث */}
          <Link href={`/u/${encodeURIComponent(qualified[2]?.username ?? '')}`}
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-amber-800 flex items-center justify-center text-xl font-black text-amber-200">
              {qualified[2]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-semibold max-w-[60px] text-center truncate">
              {qualified[2]?.username}
            </span>
            <div className="bg-amber-800 rounded-t-lg w-16 h-12 flex flex-col items-center justify-center">
              <span className="text-xl">🥉</span>
              <span className="text-xs font-bold text-amber-200">
                {qualified[2]?.adjusted_points.toFixed(1)}
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* الجدول الرئيسي */}
      {loading ? (
        <div className="card animate-pulse h-80 bg-slate-700/50" />
      ) : (
        <>
          <LeaderboardTable entries={qualified} currentUserId={user?.id} />

          {/* في طور التأهل */}
          {qualifying.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-black text-slate-300 mb-1">{lb.qualifying}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {lb.qualifyingDesc} {MIN} {lb.qualifyingDesc2}
              </p>
              <div className="card p-0 overflow-hidden opacity-75">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-slate-700 bg-slate-800/60">
                      <th className="py-3 px-4 text-right">{lb.colUser}</th>
                      <th className="py-3 px-4 text-center">{lb.colPreds}</th>
                      <th className="py-3 px-4 text-center">{lb.colRemaining}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualifying.map(entry => {
                      const remaining     = MIN - entry.total_predictions;
                      const isCurrentUser = entry.id === user?.id;
                      return (
                        <tr key={entry.id}
                          className={`border-b border-slate-700/50 ${isCurrentUser ? 'bg-blue-900/20' : ''}`}>
                          <td className="py-3 px-4">
                            <Link href={`/u/${encodeURIComponent(entry.username)}`}
                              className="flex items-center gap-2 hover:opacity-80">
                              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                {entry.username[0]?.toUpperCase()}
                              </div>
                              <span className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                {entry.username}
                                {isCurrentUser && <span className="text-xs text-slate-400 mr-1">{lb.youLabel}</span>}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {entry.total_predictions}/{MIN}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-400 font-bold text-xs">
                            {lb.remaining} {remaining}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
