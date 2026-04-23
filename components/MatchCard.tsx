import Image from 'next/image';
import { FixtureData, getMatchStatus, formatMatchTime, LEAGUES } from '@/lib/football-api';

interface Props {
  fixture: FixtureData;
  showPredictButton?: boolean;
  userPrediction?: { home_goals: number; away_goals: number; points_earned: number | null } | null;
}

export function MatchCard({ fixture, showPredictButton = false, userPrediction }: Props) {
  const status = getMatchStatus(fixture);
  const time = formatMatchTime(fixture.fixture.date);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);

  // إيجاد اسم الدوري بالعربية
  const leagueInfo = Object.values(LEAGUES).find(l => l.id === fixture.league.id);

  return (
    <div className="card hover:border-slate-600 transition-colors">
      {/* Header: الدوري + الوقت */}
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
            {isFinished ? 'انتهت' : status.live ? status.label : time}
          </span>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2">
        {/* الفريق المضيف */}
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

        {/* النتيجة */}
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
              {fixture.score.halftime.home} - {fixture.score.halftime.away} ش.أ
            </span>
          )}
        </div>

        {/* الفريق الضيف */}
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

      {/* توقع المستخدم (إن وجد) */}
      {userPrediction && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">توقعك:</span>
          <span className="text-sm font-bold text-blue-400">
            {userPrediction.home_goals} - {userPrediction.away_goals}
          </span>
          {userPrediction.points_earned !== null && (
            <span className={`text-sm font-bold ${
              userPrediction.points_earned === 5 ? 'text-amber-400' :
              userPrediction.points_earned >= 3 ? 'text-green-400' : 'text-red-400'
            }`}>
              +{userPrediction.points_earned} نقطة
            </span>
          )}
        </div>
      )}

      {/* زر التوقع */}
      {showPredictButton && !userPrediction && fixture.fixture.status.short === 'NS' && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <a
            href="/predict"
            className="block text-center btn-primary text-sm w-full"
          >
            توقع النتيجة
          </a>
        </div>
      )}
    </div>
  );
}
