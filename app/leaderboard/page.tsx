'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LeaderboardTable } from '@/components/Leaderboard';
import { Profile } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

type TimeFilter = 'week' | 'month' | 'all';

export type LeaderboardEntry = Profile & {
  rank: number;
  correct_predictions: number;
  total_predictions: number;
  accuracy_rate: number;      // 0–1
  adjusted_points: number;    // total_points × (1 + accuracy_rate)
};

const MIN_PREDICTIONS = 10;

export default function LeaderboardPage() {
  const { user } = useUser();
  const [qualified, setQualified] = useState<LeaderboardEntry[]>([]);
  const [qualifying, setQualifying] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1) جلب الـ profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('total_points', { ascending: false })
          .limit(100);

        const userIds = (profiles ?? []).map((p: Profile) => p.id);
        if (userIds.length === 0) {
          setQualified([]);
          setQualifying([]);
          return;
        }

        // 2) جلب كل التوقعات للمستخدمين
        const { data: preds } = await supabase
          .from('predictions')
          .select('user_id, points_earned')
          .in('user_id', userIds);

        // 3) حساب الإحصائيات لكل مستخدم
        const statsMap: Record<string, { total: number; settled: number; correct: number }> = {};
        (preds ?? []).forEach((p: { user_id: string; points_earned: number | null }) => {
          if (!statsMap[p.user_id]) statsMap[p.user_id] = { total: 0, settled: 0, correct: 0 };
          statsMap[p.user_id].total++;
          if (p.points_earned !== null) {
            statsMap[p.user_id].settled++;
            if (p.points_earned > 0) statsMap[p.user_id].correct++;
          }
        });

        // 4) بناء الإدخالات مع النقاط المعدلة
        const entries: LeaderboardEntry[] = (profiles ?? []).map((p: Profile) => {
          const s = statsMap[p.id] ?? { total: 0, settled: 0, correct: 0 };
          const accuracy_rate = s.settled > 0 ? s.correct / s.settled : 0;
          const adjusted_points = p.total_points * (1 + accuracy_rate);
          return {
            ...p,
            rank: 0,
            correct_predictions: s.correct,
            total_predictions: s.total,
            accuracy_rate,
            adjusted_points,
          };
        });

        // 5) فصل المؤهلين عن غير المؤهلين
        const q = entries
          .filter(e => e.total_predictions >= MIN_PREDICTIONS)
          .sort((a, b) =>
            b.adjusted_points !== a.adjusted_points
              ? b.adjusted_points - a.adjusted_points
              : b.accuracy_rate - a.accuracy_rate
          )
          .map((e, i) => ({ ...e, rank: i + 1 }));

        const notQ = entries
          .filter(e => e.total_predictions < MIN_PREDICTIONS)
          .sort((a, b) => b.total_predictions - a.total_predictions)
          .map((e, i) => ({ ...e, rank: i + 1 }));

        setQualified(q);
        setQualifying(notQ);
      } catch {
        setQualified([]);
        setQualifying([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter]);

  const myRank = qualified.findIndex(e => e.id === user?.id) + 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">الليدربورد 🏆</h1>
        {myRank > 0 && (
          <div className="card py-2 px-4 text-sm">
            <span className="text-slate-400">مركزك: </span>
            <span className="font-black text-blue-400 text-lg">#{myRank}</span>
          </div>
        )}
      </div>

      {/* Time Filter */}
      <div className="flex gap-2 mb-6">
        {([['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['all', 'الكل']] as [TimeFilter, string][]).map(
          ([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                timeFilter === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Top 3 Podium */}
      {!loading && qualified.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* المركز الثاني */}
          <Link href={`/u/${encodeURIComponent(qualified[1]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
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
          <Link href={`/u/${encodeURIComponent(qualified[0]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
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
          <Link href={`/u/${encodeURIComponent(qualified[2]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
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
              <h2 className="text-base font-black text-slate-300 mb-3">في طور التأهل 🎯</h2>
              <p className="text-xs text-slate-500 mb-4">
                يحتاج كل مستخدم {MIN_PREDICTIONS} توقعات على الأقل للدخول في الترتيب الرسمي
              </p>
              <div className="card p-0 overflow-hidden opacity-75">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-slate-700 bg-slate-800/60">
                      <th className="py-3 px-4 text-right">المستخدم</th>
                      <th className="py-3 px-4 text-center">التوقعات</th>
                      <th className="py-3 px-4 text-center">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualifying.map(entry => {
                      const remaining = MIN_PREDICTIONS - entry.total_predictions;
                      const isCurrentUser = entry.id === user?.id;
                      return (
                        <tr key={entry.id} className={`border-b border-slate-700/50 ${isCurrentUser ? 'bg-blue-900/20' : ''}`}>
                          <td className="py-3 px-4">
                            <Link href={`/u/${encodeURIComponent(entry.username)}`} className="flex items-center gap-2 hover:opacity-80">
                              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                {entry.username[0]?.toUpperCase()}
                              </div>
                              <span className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                {entry.username}
                                {isCurrentUser && <span className="text-xs text-slate-400 mr-1">(أنت)</span>}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {entry.total_predictions}/{MIN_PREDICTIONS}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-400 font-bold text-xs">
                            باقي {remaining}
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
