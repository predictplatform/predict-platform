'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LeaderboardTable } from '@/components/Leaderboard';
import { Profile } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

type TimeFilter = 'week' | 'month' | 'all';

type LeaderboardEntry = Profile & {
  rank: number;
  correct_predictions?: number;
};

export default function LeaderboardPage() {
  const { user } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
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

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('total_points', { ascending: false })
          .limit(50);

        // جلب عدد التوقعات الصحيحة لكل مستخدم
        const userIds = (profiles ?? []).map((p: Profile) => p.id);
        let correctMap: Record<string, number> = {};

        if (userIds.length > 0) {
          const { data: correctPreds } = await supabase
            .from('predictions')
            .select('user_id')
            .in('user_id', userIds)
            .eq('points_earned', 5);

          (correctPreds ?? []).forEach((p: { user_id: string }) => {
            correctMap[p.user_id] = (correctMap[p.user_id] ?? 0) + 1;
          });
        }

        const ranked: LeaderboardEntry[] = (profiles ?? []).map((p: Profile, i: number) => ({
          ...p,
          rank: i + 1,
          correct_predictions: correctMap[p.id] ?? 0,
        }));

        setEntries(ranked);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter]);

  const myRank = entries.findIndex(e => e.id === user?.id) + 1;

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
      {!loading && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* المركز الثاني */}
          <Link href={`/u/${encodeURIComponent(entries[1]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-xl font-black text-slate-200">
              {entries[1]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-semibold max-w-[60px] text-center truncate">
              {entries[1]?.username}
            </span>
            <div className="bg-slate-600 rounded-t-lg w-16 h-16 flex flex-col items-center justify-center">
              <span className="text-xl">🥈</span>
              <span className="text-xs font-bold text-slate-300">{entries[1]?.total_points}</span>
            </div>
          </Link>

          {/* المركز الأول */}
          <Link href={`/u/${encodeURIComponent(entries[0]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-2xl font-black text-white">
              {entries[0]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-amber-400 font-bold max-w-[70px] text-center truncate">
              {entries[0]?.username}
            </span>
            <div className="bg-amber-600 rounded-t-lg w-20 h-24 flex flex-col items-center justify-center">
              <span className="text-2xl">🥇</span>
              <span className="text-sm font-black text-white">{entries[0]?.total_points}</span>
            </div>
          </Link>

          {/* المركز الثالث */}
          <Link href={`/u/${encodeURIComponent(entries[2]?.username ?? '')}`} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-amber-800 flex items-center justify-center text-xl font-black text-amber-200">
              {entries[2]?.username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-semibold max-w-[60px] text-center truncate">
              {entries[2]?.username}
            </span>
            <div className="bg-amber-800 rounded-t-lg w-16 h-12 flex flex-col items-center justify-center">
              <span className="text-xl">🥉</span>
              <span className="text-xs font-bold text-amber-200">{entries[2]?.total_points}</span>
            </div>
          </Link>
        </div>
      )}

      {/* Full Table */}
      {loading ? (
        <div className="card animate-pulse h-80 bg-slate-700/50" />
      ) : (
        <LeaderboardTable entries={entries} currentUserId={user?.id} />
      )}
    </div>
  );
}
