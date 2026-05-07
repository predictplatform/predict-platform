'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LeaderboardTable } from '@/components/Leaderboard';
import { LeagueSelector } from '@/components/LeagueSelector';
import type { LeaderboardEntry } from '@/app/api/leaderboard/route';
import { useT } from '@/hooks/useT';

export default function LeaderboardPage() {
  const t = useT();
  const { user, isLoaded } = useUser();
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [qualified,  setQualified]  = useState<LeaderboardEntry[]>([]);
  const [qualifying, setQualifying] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const url = selectedLeague !== null
          ? `/api/leaderboard?league_id=${selectedLeague}`
          : '/api/leaderboard';

        const res  = await fetch(url);
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
  }, [selectedLeague]);

  const myRank = qualified.findIndex(e => e.id === user?.id) + 1;
  const MIN    = selectedLeague !== null ? 5 : 10;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* بانر الزائر غير المسجل */}
      {isLoaded && !user && (
        <div className="flex items-center justify-between gap-3 bg-blue-600/20 border border-blue-500/40 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm font-bold text-blue-300">{t.leaderboard.guestBanner}</p>
          <Link
            href="/sign-up"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-black px-4 py-2 rounded-lg"
          >
            {t.leaderboard.guestBtn}
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">{t.leaderboard.title}</h1>
        {myRank > 0 && (
          <div className="card py-2 px-4 text-sm">
            <span className="text-slate-400">{t.leaderboard.yourRank} </span>
            <span className="font-black text-blue-400 text-lg">#{myRank}</span>
          </div>
        )}
      </div>

      {/* تصنيفات الدوريات */}
      <LeagueSelector
        selected={selectedLeague}
        onChange={setSelectedLeague}
        withAll
        allLabel={t.leaderboard.allLabel}
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
              <h2 className="text-base font-black text-slate-300 mb-1">{t.leaderboard.qualifying}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {t.leaderboard.qualifyingDesc} {MIN} {t.leaderboard.qualifyingDesc2}
              </p>
              <div className="card p-0 overflow-hidden opacity-75">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-slate-700 bg-slate-800/60">
                      <th className="py-3 px-4 text-right">{t.leaderboard.colUser}</th>
                      <th className="py-3 px-4 text-center">{t.leaderboard.colPreds}</th>
                      <th className="py-3 px-4 text-center">{t.leaderboard.colRemaining}</th>
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
                                {isCurrentUser && <span className="text-xs text-slate-400 mr-1">{t.leaderboard.youLabel}</span>}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {entry.total_predictions}/{MIN}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-400 font-bold text-xs">
                            {t.leaderboard.remaining} {remaining}
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
