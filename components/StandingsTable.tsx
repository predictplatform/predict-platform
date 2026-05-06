'use client';

import Image from 'next/image';
import { useT } from '@/hooks/useT';

interface StandingTeam {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

interface Props {
  standings: StandingTeam[];
  leagueName: string;
}

function getRowClass(description: string | null): string {
  if (!description) return '';
  const d = description.toLowerCase();
  if (d.includes('champions league') || d.includes('promotion')) return 'border-r-2 border-blue-500';
  if (d.includes('europa league')) return 'border-r-2 border-orange-500';
  if (d.includes('conference')) return 'border-r-2 border-green-500';
  if (d.includes('relegation') || d.includes('هبوط')) return 'border-r-2 border-red-500';
  return '';
}

export function StandingsTable({ standings, leagueName }: Props) {
  const t = useT();

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
        <h3 className="font-bold text-white">{leagueName}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-700">
              <th className="py-2 px-3 text-right w-8">#</th>
              <th className="py-2 px-3 text-right">{t.standings.colTeam}</th>
              <th className="py-2 px-3 text-center w-8">{t.standings.colPlayed}</th>
              <th className="py-2 px-3 text-center w-8">{t.standings.colWin}</th>
              <th className="py-2 px-3 text-center w-8">{t.standings.colDraw}</th>
              <th className="py-2 px-3 text-center w-8">{t.standings.colLose}</th>
              <th className="py-2 px-3 text-center w-12">{t.standings.colGoals}</th>
              <th className="py-2 px-3 text-center w-8">{t.standings.colDiff}</th>
              <th className="py-2 px-3 text-center w-10 font-bold text-white">{t.standings.colPoints}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr
                key={team.team.id}
                className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${getRowClass(team.description)}`}
              >
                <td className="py-2 px-3 text-slate-400 font-semibold">{team.rank}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={team.team.logo}
                      alt={team.team.name}
                      width={20}
                      height={20}
                      className="object-contain"
                      unoptimized
                    />
                    <span className="text-white font-semibold text-xs">{team.team.name}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-center text-slate-300">{team.all.played}</td>
                <td className="py-2 px-3 text-center text-green-400">{team.all.win}</td>
                <td className="py-2 px-3 text-center text-yellow-400">{team.all.draw}</td>
                <td className="py-2 px-3 text-center text-red-400">{team.all.lose}</td>
                <td className="py-2 px-3 text-center text-slate-300 text-xs">
                  {team.all.goals.for}:{team.all.goals.against}
                </td>
                <td className={`py-2 px-3 text-center text-xs font-semibold ${
                  team.goalsDiff > 0 ? 'text-green-400' : team.goalsDiff < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                </td>
                <td className="py-2 px-3 text-center font-black text-white text-base">
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-700 flex flex-wrap gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span>{t.standings.legendCL}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <span>{t.standings.legendEL}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span>{t.standings.legendRel}</span>
        </div>
      </div>
    </div>
  );
}
