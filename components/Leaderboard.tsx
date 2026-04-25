import Image from 'next/image';
import Link from 'next/link';
import { Profile } from '@/lib/supabase';

interface LeaderboardEntry extends Profile {
  rank: number;
  correct_predictions?: number;
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
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs border-b border-slate-700 bg-slate-800/60">
            <th className="py-3 px-4 text-right w-12">#</th>
            <th className="py-3 px-4 text-right">المستخدم</th>
            <th className="py-3 px-4 text-center">توقعات صح</th>
            <th className="py-3 px-4 text-center font-bold text-white">النقاط</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.id === currentUserId;
            return (
              <tr
                key={entry.id}
                className={`border-b border-slate-700/50 transition-colors ${
                  isCurrentUser ? 'bg-blue-900/20 border-blue-700/50' : 'hover:bg-slate-700/20'
                }`}
              >
                {/* الترتيب */}
                <td className="py-3 px-4">
                  <span className={`font-black text-base ${medalColors[entry.rank] ?? 'text-slate-400'}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </span>
                </td>

                {/* المستخدم */}
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
                      {isCurrentUser && <span className="text-xs text-slate-400 mr-1">(أنت)</span>}
                    </span>
                  </Link>
                </td>

                {/* توقعات صحيحة */}
                <td className="py-3 px-4 text-center text-slate-300">
                  {entry.correct_predictions ?? '—'}
                </td>

                {/* النقاط */}
                <td className="py-3 px-4 text-center">
                  <span className={`font-black text-lg ${
                    entry.rank === 1 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {entry.total_points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {entries.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          لا يوجد لاعبون بعد. كن الأول! 🏆
        </div>
      )}
    </div>
  );
}
