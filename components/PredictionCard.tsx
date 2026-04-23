'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ScoreInput } from './ScoreInput';
import { FixtureData, formatMatchTime, LEAGUES } from '@/lib/football-api';
import { getPointsLabel, getPointsColor } from '@/lib/points';

interface Props {
  fixture: FixtureData;
  existingPrediction?: {
    home_goals: number;
    away_goals: number;
    points_earned: number | null;
  } | null;
  onSubmit: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>;
}

export function PredictionCard({ fixture, existingPrediction, onSubmit }: Props) {
  const [homeGoals, setHomeGoals] = useState(existingPrediction?.home_goals ?? 0);
  const [awayGoals, setAwayGoals] = useState(existingPrediction?.away_goals ?? 0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingPrediction);

  const leagueInfo = Object.values(LEAGUES).find(l => l.id === fixture.league.id);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);
  const isStarted = fixture.fixture.status.short !== 'NS';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(String(fixture.fixture.id), homeGoals, awayGoals);
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

      {/* Teams + Score Input */}
      <div className="flex items-center justify-between gap-4">
        {/* الفريق المضيف */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={52}
            height={52}
            unoptimized
            className="object-contain"
          />
          <span className="text-xs font-bold text-center text-white line-clamp-2 leading-tight">
            {fixture.teams.home.name}
          </span>
        </div>

        {/* Input في المنتصف */}
        <div className="flex items-center gap-3">
          {submitted || isStarted ? (
            // عرض التوقع بعد التأكيد
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl font-black text-white tabular-nums">
                {homeGoals} - {awayGoals}
              </div>
              {existingPrediction?.points_earned !== undefined && (
                <span className={`text-sm font-bold ${getPointsColor(existingPrediction?.points_earned ?? null)}`}>
                  {getPointsLabel(existingPrediction?.points_earned ?? null)}
                </span>
              )}
            </div>
          ) : (
            <>
              <ScoreInput
                label={fixture.teams.home.name}
                onChange={setHomeGoals}
                initialValue={homeGoals}
                disabled={submitted || isStarted}
              />
              <span className="text-slate-500 font-bold text-xl">-</span>
              <ScoreInput
                label={fixture.teams.away.name}
                onChange={setAwayGoals}
                initialValue={awayGoals}
                disabled={submitted || isStarted}
              />
            </>
          )}
        </div>

        {/* الفريق الضيف */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={52}
            height={52}
            unoptimized
            className="object-contain"
          />
          <span className="text-xs font-bold text-center text-white line-clamp-2 leading-tight">
            {fixture.teams.away.name}
          </span>
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
    </div>
  );
}
