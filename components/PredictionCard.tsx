'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PredictionStats } from './PredictionStats';
import { FixtureData, formatMatchTime, LEAGUES } from '@/lib/football-api';
import { getPointsLabel, getPointsColor } from '@/lib/points';
import type { MatchStats } from '@/app/api/predictions/stats/route';

interface Props {
  fixture: FixtureData;
  existingPrediction?: {
    home_goals: number;
    away_goals: number;
    points_earned: number | null;
  } | null;
  onSubmit: (matchId: string, homeGoals: number, awayGoals: number, leagueId: number) => Promise<void>;
  stats?: MatchStats | null;
}

// حقل الأهداف — نفس البنية قبل وبعد القفل، الأزرار تصبح invisible فقط
function GoalInput({
  value,
  onDecrement,
  onIncrement,
  locked,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  locked: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 h-10 w-full max-w-[108px]">
      <button
        onClick={onDecrement}
        disabled={locked || value === 0}
        aria-label="تقليل"
        className={`w-8 h-8 rounded-full border-2 border-slate-500 text-xl font-bold shrink-0
                    flex items-center justify-center text-white transition-all active:scale-95
                    hover:bg-slate-600 hover:border-slate-400
                    disabled:opacity-30 disabled:cursor-not-allowed
                    ${locked ? 'invisible' : ''}`}
      >
        −
      </button>

      <span className="text-3xl font-black text-white tabular-nums w-8 text-center shrink-0">
        {value}
      </span>

      <button
        onClick={onIncrement}
        disabled={locked || value === 15}
        aria-label="زيادة"
        className={`w-8 h-8 rounded-full border-2 border-slate-500 text-xl font-bold shrink-0
                    flex items-center justify-center text-white transition-all active:scale-95
                    hover:bg-slate-600 hover:border-slate-400
                    disabled:opacity-30 disabled:cursor-not-allowed
                    ${locked ? 'invisible' : ''}`}
      >
        +
      </button>
    </div>
  );
}

export function PredictionCard({ fixture, existingPrediction, onSubmit, stats }: Props) {
  const [homeGoals, setHomeGoals] = useState(existingPrediction?.home_goals ?? 0);
  const [awayGoals, setAwayGoals] = useState(existingPrediction?.away_goals ?? 0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingPrediction);

  const leagueInfo = Object.values(LEAGUES).find(l => l.id === fixture.league.id);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);
  const isStarted = fixture.fixture.status.short !== 'NS';
  const isLocked = submitted || isStarted;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(String(fixture.fixture.id), homeGoals, awayGoals, fixture.league.id);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border border-slate-700 hover:border-slate-600 transition-colors">
      {/* League */}
      <div className="flex items-center gap-2 mb-4">
        <Image src={fixture.league.logo} alt="" width={16} height={16} unoptimized />
        <span className="text-xs text-slate-400 font-semibold">
          {leagueInfo?.name ?? fixture.league.name}
        </span>
        <span className="text-xs text-slate-500 mr-auto">
          {formatMatchTime(fixture.fixture.date)}
        </span>
      </div>

      {/* Teams + Score — نفس الـ layout تماماً في كل الحالات */}
      <div className="flex items-center gap-2">

        {/* الفريق المضيف */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0 overflow-hidden">
          {/* لوقو بحجم ثابت دائماً */}
          <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src={fixture.teams.home.logo}
              alt={fixture.teams.home.name}
              width={48}
              height={48}
              unoptimized
              className="object-contain max-w-full max-h-full"
            />
          </div>
          {/* اسم الفريق بارتفاع ثابت */}
          <div className="h-8 flex items-center justify-center w-full">
            <span className="text-xs font-bold text-center text-white line-clamp-2 leading-tight">
              {fixture.teams.home.name}
            </span>
          </div>
          {/* حقل الأهداف */}
          <GoalInput
            value={homeGoals}
            onDecrement={() => setHomeGoals(v => Math.max(0, v - 1))}
            onIncrement={() => setHomeGoals(v => Math.min(15, v + 1))}
            locked={isLocked}
          />
        </div>

        {/* الفاصل المركزي */}
        <div className="flex flex-col items-center shrink-0 gap-1">
          <span className="text-xl font-black text-slate-500">-</span>
          {isFinished && existingPrediction?.points_earned !== undefined && (
            <span className={`text-xs font-bold ${getPointsColor(existingPrediction?.points_earned ?? null)}`}>
              {getPointsLabel(existingPrediction?.points_earned ?? null)}
            </span>
          )}
        </div>

        {/* الفريق الضيف */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <Image
              src={fixture.teams.away.logo}
              alt={fixture.teams.away.name}
              width={48}
              height={48}
              unoptimized
              className="object-contain max-w-full max-h-full"
            />
          </div>
          <div className="h-8 flex items-center justify-center w-full">
            <span className="text-xs font-bold text-center text-white line-clamp-2 leading-tight">
              {fixture.teams.away.name}
            </span>
          </div>
          <GoalInput
            value={awayGoals}
            onDecrement={() => setAwayGoals(v => Math.max(0, v - 1))}
            onIncrement={() => setAwayGoals(v => Math.min(15, v + 1))}
            locked={isLocked}
          />
        </div>
      </div>

      {/* زر التأكيد */}
      {!submitted && !isStarted && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full btn-primary text-sm py-2.5 disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'تأكيد التوقع'}
        </button>
      )}

      {submitted && !isFinished && (
        <div className="mt-3 text-center text-xs text-slate-400">
          تم تسجيل توقعك ✓ — لا يمكن التعديل بعد الآن
        </div>
      )}

      {isStarted && !submitted && (
        <div className="mt-3 text-center text-xs text-red-400">
          انطلقت المباراة — التوقع مغلق
        </div>
      )}

      {stats !== undefined && (
        <PredictionStats
          stats={stats ?? { match_id: String(fixture.fixture.id), home: 0, draw: 0, away: 0, total: 0 }}
          homeTeam={fixture.teams.home.name}
          awayTeam={fixture.teams.away.name}
        />
      )}
    </div>
  );
}
