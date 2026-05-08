'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/hooks/useT';

// الحقول المطلوبة فقط — بدون profile_complete الذي لا يُعرض في الجدول
export interface LeaderboardEntry {
  id:                  string;
  username:            string;
  avatar_url:          string | null;
  total_points:        number;
  favorite_team:       string | null;
  created_at:          string;
  rank:                number;
  correct_predictions: number;
  total_predictions:   number;
  accuracy_rate:       number;
  adjusted_points:     number;
}

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const medalColors: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-amber-700',
};

export function LeaderboardTable({ entries, currentUserId }: Props) {
  const t = useT();

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs border-b border-slate-700 bg-slate-800/60">
            <th className="py-3 px-4 text-right w-12">{t.leaderboardTable.colHash}</th>
            <th className="py-3 px-4 text-right">{t.leaderboardTable.colUser}</th>
            <th className="py-3 px-4 text-center">{t.leaderboardTable.colAccuracy}</th>
            <th className="py-3 px-4 text-center">{t.leaderboardTable.colPoints}</th>
            <th className="py-3 px-4 text-center font-bold text-white">{t.leaderboardTable.colAdjusted}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.id === currentUserId;
            const accuracyPct = Math.round(entry.accuracy_rate * 100);
            return (
              <tr
                key={entry.id}
                className={`border-b border-slate-700/50 transition-colors ${
                  isCurrentUser ? 'bg-blue-900/20 border-blue-700/50' : 'hover:bg-slate-700/20'
                }`}
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <span className={`font-black text-base ${medalColors[entry.rank] ?? 'text-slate-400'}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </span>
                </td>

                {/* User */}
                <td className="py-3 px-4">
                  <Link href={`/u/${encodeURIComponent(entry.username)}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {entry.avatar_url ? (
                      <Image
                        src={entry.avatar_url}
                        alt={entry.username}
                        width={28}
                        height={28}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {entry.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                      {entry.username}
                      {isCurrentUser && <span className="text-xs text-slate-400 mr-1">{t.leaderboardTable.youLabel}</span>}
                    </span>
                  </Link>
                </td>

                {/* Accuracy */}
                <td className="py-3 px-4 text-center">
                  <span className={`text-sm font-bold ${
                    accuracyPct >= 60 ? 'text-green-400' :
                    accuracyPct >= 40 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {accuracyPct}%
                  </span>
                </td>

                {/* Raw points */}
                <td className="py-3 px-4 text-center text-slate-400 text-sm">
                  {entry.total_points}
                </td>

                {/* Adjusted points */}
                <td className="py-3 px-4 text-center">
                  <span className={`font-black text-lg ${
                    entry.rank === 1 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {entry.adjusted_points.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {entries.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          {t.leaderboardTable.noPlayers}
        </div>
      )}
    </div>
  );
}
