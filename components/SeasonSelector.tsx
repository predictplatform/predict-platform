'use client';

import { useT } from '@/hooks/useT';

export interface SeasonOption {
  id:        string;
  name:      string;    // العربي
  name_en:   string;    // الإنجليزي
  is_active: boolean;
}

interface Props {
  seasons:   SeasonOption[];
  /** uuid محدد | 'all' | null (= الموسم النشط تلقائياً) */
  selected:  string | null;
  onChange:  (id: string | null) => void;
  className?: string;
}

/**
 * قائمة منسدلة لاختيار الموسم.
 * null → الموسم النشط (الافتراضي)
 * 'all' → كل المواسم
 * uuid → موسم محدد
 */
export function SeasonSelector({ seasons, selected, onChange, className = '' }: Props) {
  const t    = useT();
  const isAr = t.dir === 'rtl';

  // القيمة الفعلية في الـ <select> — null نحوّلها للموسم النشط
  const activeSeason  = seasons.find(s => s.is_active);
  const effectiveVal  = selected === null
    ? (activeSeason?.id ?? '')
    : selected;

  const handleChange = (val: string) => {
    if (val === 'all') {
      onChange('all');
    } else if (activeSeason && val === activeSeason.id) {
      onChange(null); // العودة للافتراضي = null
    } else {
      onChange(val || null);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-slate-400 shrink-0 font-semibold">
        {isAr ? 'الموسم:' : 'Season:'}
      </span>
      <select
        value={effectiveVal}
        onChange={e => handleChange(e.target.value)}
        className="
          flex-1 bg-slate-800 border border-slate-700 text-white text-sm
          rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500
          focus:border-blue-500 cursor-pointer transition-colors
        "
      >
        {/* كل المواسم */}
        <option value="all">
          {isAr ? '🌐 كل المواسم' : '🌐 All Seasons'}
        </option>

        {seasons.map(s => (
          <option key={s.id} value={s.id}>
            {isAr ? s.name : s.name_en}
            {s.is_active ? (isAr ? ' ★ الحالي' : ' ★ Current') : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
