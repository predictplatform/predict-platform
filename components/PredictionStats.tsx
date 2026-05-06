'use client';

import type { MatchStats } from '@/app/api/predictions/stats/route';
import { useT } from '@/hooks/useT';

interface Props {
  stats: MatchStats;
  homeTeam: string;
  awayTeam: string;
}

export function PredictionStats({ stats, homeTeam, awayTeam }: Props) {
  const t = useT();
  const { home, draw, away, total } = stats;

  if (total === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-700/60">
        <p className="text-xs text-slate-500 text-center">{t.predStats.beFirst}</p>
      </div>
    );
  }

  const homePct = Math.round((home / total) * 100);
  const drawPct = Math.round((draw / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/60">
      {/* Labels */}
      <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
        <span className="text-blue-400 max-w-[35%] truncate">{homeTeam}</span>
        <span className="text-slate-400">{t.predStats.draw}</span>
        <span className="text-red-400 max-w-[35%] truncate text-left">{awayTeam}</span>
      </div>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden w-full">
        {homePct > 0 && (
          <div
            className="bg-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${homePct}%` }}
          />
        )}
        {drawPct > 0 && (
          <div
            className="bg-slate-500 transition-all duration-700 ease-out"
            style={{ width: `${drawPct}%` }}
          />
        )}
        {awayPct > 0 && (
          <div
            className="bg-red-500 transition-all duration-700 ease-out"
            style={{ width: `${awayPct}%` }}
          />
        )}
      </div>

      {/* Percentages */}
      <div className="flex justify-between items-center mt-1.5 text-xs font-bold">
        <span className="text-blue-400">{homePct}%</span>
        <span className="text-slate-400 text-[10px]">{total} {t.predStats.predCount}</span>
        <span className="text-red-400">{awayPct}%</span>
      </div>

      {drawPct > 0 && (
        <div className="text-center -mt-4 text-xs text-slate-400">
          {drawPct}%
        </div>
      )}
    </div>
  );
}
