'use client';

import { LEAGUES, LeagueKey } from '@/lib/football-api';

// اسم مختصر يناسب الـ segmented control
const SHORT: Record<number, string> = {
  944: 'روشن',
  8:   'إنجليزي',
  564: 'إسباني',
  384: 'إيطالي',
  82:  'ألماني',
};

interface LeagueSelectorProps {
  selected: number | null;
  onChange: (id: number | null) => void;
  withAll?: boolean; // يضيف زر "الكل" في البداية (للمباريات)
  className?: string;
}

export function LeagueSelector({
  selected,
  onChange,
  withAll = false,
  className = '',
}: LeagueSelectorProps) {
  const leagues = Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][];

  return (
    <div className={`flex bg-slate-800 rounded-xl p-1 gap-0.5 ${className}`}>
      {withAll && (
        <button
          onClick={() => onChange(null)}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
            selected === null
              ? 'bg-slate-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none">🌐</span>
          <span className="mt-0.5 leading-none">الكل</span>
        </button>
      )}

      {leagues.map(([, league]) => (
        <button
          key={league.id}
          onClick={() => onChange(league.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
            selected === league.id
              ? 'bg-slate-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none">{league.flag}</span>
          <span className="mt-0.5 leading-none">{SHORT[league.id] ?? league.name}</span>
        </button>
      ))}
    </div>
  );
}
