'use client';

import Image from 'next/image';
import { FixtureData, getMatchStatus, formatMatchTime, LEAGUES } from '@/lib/football-api';
import { useT } from '@/hooks/useT';

interface Props {
  fixture: FixtureData;
  showPredictButton?: boolean;
  userPrediction?: { home_goals: number; away_goals: number; points_earned: number | null } | null;
  todayStr?: string;
  tomorrowStr?: string;
}

export function MatchCard({ fixture, showPredictButton = false, userPrediction, todayStr, tomorrowStr }: Props) {
  const t = useT();
  const status = getMatchStatus(fixture);
  const time = formatMatchTime(fixture.fixture.date);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);

  const leagueInfo = Object.values(LEAGUES).find(l => l.id === fixture.league.id);

  const fixtureDateStr = fixture.fixture.date.substring(0, 10);
  const today    = todayStr    ?? new Date().toISOString().split('T')[0];
  const tomorrow = tomorrowStr ?? new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const short    = fixture.fixture.status.short;
  const isNS         = short === 'NS';
  const isWithin48h  = fixtureDateStr === today || fixtureDateStr === tomorrow;
  const isFuture     = fixtureDateStr > tomorrow;

  type PredictState = 'button' | 'locked' | 'soon' | 'none';
  let predictState: PredictState = 'none';
  let soonDay = '';

  if (showPredictButton && !userPrediction) {
    if (isWithin48h && isNS) {
      predictState = 'button';
    } else if (isWithin48h && !isNS) {
      predictState = 'locked';
    } else if (isFuture) {
      predictState = 'soon';
      soonDay = new Date(fixtureDateStr + 'T12:00:00').toLocaleDateString(t.locale, { weekday: 'long' });
    }
  }

  return (
    <div className="card hover:border-slate-600 transition-colors">
      {/* Header: League + Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.league.logo}
            alt={fixture.league.name}
            width={20}
            height={20}
            className="object-contain"
            unoptimized
          />
          <span className="text-xs text-slate-400 font-semibold">
            {leagueInfo?.name ?? fixture.league.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {status.live && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span className={`text-xs font-bold ${status.color}`}>
            {isFinished ? t.matchCard.finished : status.live ? status.label : time}
          </span>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
          <span className="text-xs font-bold text-center text-slate-200 leading-tight line-clamp-2">
            {fixture.teams.home.name}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {fixture.goals.home !== null && fixture.goals.away !== null ? (
            <div className="text-3xl font-black text-white tabular-nums">
              {fixture.goals.home} - {fixture.goals.away}
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-500">VS</div>
          )}
          {status.live && (
            <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
          )}
          {isFinished && fixture.score.halftime.home !== null && (
            <span className="text-xs text-slate-500">
              {fixture.score.halftime.home} - {fixture.score.halftime.away} {t.matchCard.halfTime}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
          <span className="text-xs font-bold text-center text-slate-200 leading-tight line-clamp-2">
            {fixture.teams.away.name}
          </span>
        </div>
      </div>

      {/* User prediction (if exists) */}
      {userPrediction && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t.matchCard.yourPred}</span>
            <span className="text-sm font-bold text-blue-400">
              {userPrediction.home_goals} - {userPrediction.away_goals}
            </span>
            {userPrediction.points_earned !== null ? (
              <span className={`text-sm font-bold ${
                userPrediction.points_earned === 5 ? 'text-amber-400' :
                userPrediction.points_earned >= 3 ? 'text-green-400' : 'text-red-400'
              }`}>
                +{userPrediction.points_earned} {t.matchCard.points}
              </span>
            ) : (
              <span className="text-xs text-slate-500">{t.matchCard.recorded}</span>
            )}
          </div>
        </div>
      )}

      {/* Predict button / state */}
      {predictState !== 'none' && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          {predictState === 'button' && (
            <a
              href={`/predict?date=${fixtureDateStr}`}
              className="block text-center btn-primary text-sm w-full"
            >
              {t.matchCard.predictBtn}
            </a>
          )}
          {predictState === 'locked' && (
            <p className="text-center text-xs text-slate-500 font-semibold py-1">
              {t.matchCard.matchLocked}
            </p>
          )}
          {predictState === 'soon' && (
            <p className="text-center text-xs text-slate-500 font-semibold py-1">
              {t.matchCard.soonPrefix} {soonDay}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
