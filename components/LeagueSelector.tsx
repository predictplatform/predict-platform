'use client';

import Link from 'next/link';
import { LEAGUES, LeagueKey } from '@/lib/football-api';

// اسم مختصر يناسب الـ segmented control
const SHORT: Record<number, string> = {
  944: 'روشن',
  8:   'إنجليزي',
  564: 'إسباني',
  384: 'إيطالي',
  82:  'ألماني',
};

const ITEM_BASE = 'flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all';
const ACTIVE    = 'bg-slate-600 text-white shadow';
const INACTIVE  = 'text-slate-400 hover:text-slate-200';

interface LeagueSelectorProps {
  /** وضع الأزرار (state selector) */
  selected?: number | null;
  onChange?: (id: number | null) => void;
  withAll?: boolean;
  /** وضع الروابط (navigation) — string قابل للتمرير من Server Component */
  hrefBase?: string;  // مثال: "/matches?league="  →  /matches?league=944
  className?: string;
}

export function LeagueSelector({
  selected,
  onChange,
  withAll = false,
  hrefBase,
  className = '',
}: LeagueSelectorProps) {
  const leagues = Object.entries(LEAGUES) as [LeagueKey, typeof LEAGUES[LeagueKey]][];

  const itemContent = (flag: string, shortName: string) => (
    <>
      <span className="text-base leading-none">{flag}</span>
      <span className="mt-0.5 leading-none">{shortName}</span>
    </>
  );

  return (
    <div className={`flex bg-slate-800 rounded-xl p-1 gap-0.5 ${className}`}>

      {/* زر "الكل" — فقط في وضع الأزرار */}
      {withAll && !hrefBase && (
        <button
          onClick={() => onChange?.(null)}
          className={`${ITEM_BASE} ${selected === null ? ACTIVE : INACTIVE}`}
        >
          <span className="text-base leading-none">🌐</span>
          <span className="mt-0.5 leading-none">الكل</span>
        </button>
      )}

      {leagues.map(([, league]) => {
        const content = itemContent(league.flag, SHORT[league.id] ?? league.name);
        const isActive = selected === league.id;

        return hrefBase ? (
          // وضع الروابط — للصفحة الرئيسية
          <Link
            key={league.id}
            href={`${hrefBase}${league.id}`}
            className={`${ITEM_BASE} ${INACTIVE}`}
          >
            {content}
          </Link>
        ) : (
          // وضع الأزرار — لباقي الصفحات
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
