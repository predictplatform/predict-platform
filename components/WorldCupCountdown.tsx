'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/hooks/useT';

// ── انطلاق كأس العالم 2026 ─────────────────────────────────────────
// 11 يونيو 2026 — الساعة 00:00 UTC
const WC_TARGET = new Date('2026-06-11T00:00:00Z').getTime();

function calcTime() {
  const diff = Math.max(0, WC_TARGET - Date.now());
  return {
    days:    Math.floor(diff / 864e5),
    hours:   Math.floor((diff % 864e5) / 36e5),
    minutes: Math.floor((diff % 36e5) / 6e4),
    seconds: Math.floor((diff % 6e4) / 1e3),
    done:    diff === 0,
  };
}

type TimeState = ReturnType<typeof calcTime>;

// ── خانة الرقم ─────────────────────────────────────────────────────
function Unit({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  const str = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`
          relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center
          text-2xl sm:text-3xl font-black tabular-nums tracking-tight
          border transition-colors
          ${highlight
            ? 'bg-green-900/40 border-green-600/40 text-green-300'
            : 'bg-slate-700/70 border-slate-600/40 text-white'}
        `}
      >
        {str}
      </div>
      <span className="text-[11px] sm:text-xs text-slate-400 font-semibold leading-none">
        {label}
      </span>
    </div>
  );
}

// ── الفاصل ─────────────────────────────────────────────────────────
function Sep() {
  return (
    <span className="text-xl sm:text-2xl font-black text-slate-600 pb-5 select-none leading-none">
      :
    </span>
  );
}

// ── الكومبوننت الرئيسي ─────────────────────────────────────────────
export function WorldCupCountdown() {
  const t    = useT();
  const wc   = t.worldCup;

  // null أثناء SSR لتجنب hydration mismatch
  const [time, setTime] = useState<TimeState | null>(null);

  useEffect(() => {
    setTime(calcTime());
    const id = setInterval(() => setTime(calcTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // لا نعرض شيئاً حتى يتم الـ mount، أو بعد انطلاق البطولة
  if (!time || time.done) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl max-w-lg mx-auto mt-7 mb-1">

      {/* ── الخلفية والإطار ──────────────────────────────────────── */}
      <div className="
        absolute inset-0 rounded-2xl
        bg-gradient-to-br from-slate-800/90 to-slate-900/95
        border border-green-700/25
        shadow-[0_0_40px_-12px_rgba(34,197,94,0.18)]
      " />

      {/* ── ضوء علوي خفيف ────────────────────────────────────────── */}
      <div className="
        absolute top-0 left-1/2 -translate-x-1/2
        w-48 h-10 rounded-full blur-2xl
        bg-green-500/10 pointer-events-none
      " />

      {/* ── المحتوى ───────────────────────────────────────────────── */}
      <div className="relative px-6 py-5 text-center">

        {/* العنوان */}
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <span className="text-lg">⚽</span>
          <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
            {wc.title}
          </h3>
          <span className="text-lg">🏆</span>
        </div>

        {/* تاريخ الانطلاق */}
        <p className="text-[11px] text-green-400/70 font-semibold mb-5 tracking-widest uppercase">
          {wc.subtitle}
        </p>

        {/* الأرقام */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
          <Unit value={time.days}    label={wc.days}    />
          <Sep />
          <Unit value={time.hours}   label={wc.hours}   />
          <Sep />
          <Unit value={time.minutes} label={wc.minutes} />
          <Sep />
          <Unit value={time.seconds} label={wc.seconds} highlight />
        </div>

      </div>
    </div>
  );
}
