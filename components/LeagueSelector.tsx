'use client';

import Link from 'next/link';
import { LEAGUES, LeagueKey } from '@/lib/football-api';
import { useT } from '@/hooks/useT';

const ITEM_BASE = 'flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all';
const ACTIVE    = 'bg-slate-600 text-white shadow';
const INACTIVE  = 'text-slate-400 hover:text-slate-200';

interface LeagueSelectorProps {
  selected?: number | null;
  onChange?: (id: number | null) => void;
  withAll?: boolean;
  allLabel?: string;
  hrefBase?: string;
  className?: string;
}

export function LeagueSelector({
  selected,
  onChange,
  withAll = false,
  allLabel,
  hrefBase,
  className = '',
}: LeagueSelectorProps) {
  const t = useT();
  const leagues = Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][];

  // Map league id -> translated short name
  const SHORT: Record<number, string> = {
    944: t.leagues.saudi,
    8:   t.leagues.english,
    564: t.leagues.spanish,
    384: t.leagues.italian,
    82:  t.leagues.german,
  };

  const resolvedAllLabel = allLabel ?? t.leagues.all;

  const itemContent = (flag: string, shortName: string) => (
    <>
      <span className="text-base leading-none">{flag}</span>
      <span className="mt-0.5 leading-none">{shortName}</span>
    </>
  );

  return (
    <div className={`flex bg-slate-800 rounded-xl p-1 gap-0.5 ${className}`}>

      {/* All button — only in button mode */}
      {withAll && !hrefBase && (
        <button
          onClick={() => onChange?.(null)}
          className={`${ITEM_BASE} ${selected === null ? ACTIVE : INACTIVE}`}
        >
          <span className="text-base leading-none">🌐</span>
          <span className="mt-0.5 leading-none">{resolvedAllLabel}</span>
        </button>
      )}

      {leagues.map(([, league]) => {
        const content = itemContent(league.flag, SHORT[league.id] ?? league.name);
        const isActive = selected === league.id;

        return hrefBase ? (
          <Link
            key={league.id}
            href={`${hrefBase}${league.id}`}
            className={`${ITEM_BASE} ${INACTIVE}`}
          >
            {content}
          </Link>
        ) : (
          <button
            key={league.id}
            onClick={() => onChange?.(league.id)}
            className={`${ITEM_BASE} ${isActive ? ACTIVE : INACTIVE}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
