'use client';

import { useState } from 'react';

interface Props {
  label: string;
  onChange: (val: number) => void;
  disabled?: boolean;
  initialValue?: number;
}

export function ScoreInput({ label, onChange, disabled = false, initialValue = 0 }: Props) {
  const [val, setVal] = useState(initialValue);

  const update = (newVal: number) => {
    setVal(newVal);
    onChange(newVal);
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <span className="font-bold text-sm text-slate-300 text-center leading-tight max-w-[100px] line-clamp-2">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => update(Math.max(0, val - 1))}
          disabled={disabled || val === 0}
          className="w-10 h-10 rounded-full border-2 border-slate-500 text-2xl font-bold
                     hover:bg-slate-600 hover:border-slate-400 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:scale-95 flex items-center justify-center text-white"
          aria-label="تقليل"
        >
          −
        </button>

        <span className="text-5xl font-black w-14 text-center tabular-nums text-white">
          {val}
        </span>

        <button
          onClick={() => update(Math.min(15, val + 1))}
          disabled={disabled || val === 15}
          className="w-10 h-10 rounded-full border-2 border-slate-500 text-2xl font-bold
                     hover:bg-slate-600 hover:border-slate-400 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:scale-95 flex items-center justify-center text-white"
          aria-label="زيادة"
        >
          +
        </button>
      </div>
    </div>
  );
}
