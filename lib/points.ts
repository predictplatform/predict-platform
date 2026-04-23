type Score = { homeGoals: number; awayGoals: number };

export function calculatePoints(pred: Score, result: Score): number {
  // نتيجة دقيقة 100%
  if (pred.homeGoals === result.homeGoals && pred.awayGoals === result.awayGoals) return 5;

  const predDir = getOutcome(pred.homeGoals, pred.awayGoals);
  const resultDir = getOutcome(result.homeGoals, result.awayGoals);
  const correctDir = predDir === resultDir;

  const predGap = pred.homeGoals - pred.awayGoals;
  const resultGap = result.homeGoals - result.awayGoals;
  const correctGap = predGap === resultGap;

  if (correctDir && correctGap) return 4;
  if (correctDir) return 3;
  return 0;
}

function getOutcome(h: number, a: number): 'home' | 'draw' | 'away' {
  return h > a ? 'home' : h < a ? 'away' : 'draw';
}

export function getPointsLabel(points: number | null): string {
  if (points === null) return 'في الانتظار';
  switch (points) {
    case 5: return 'نتيجة دقيقة ⭐';
    case 4: return 'اتجاه + فارق ✅';
    case 3: return 'اتجاه صحيح 👍';
    case 0: return 'غلط كلياً ❌';
    default: return `${points} نقاط`;
  }
}

export function getPointsColor(points: number | null): string {
  if (points === null) return 'text-slate-400';
  switch (points) {
    case 5: return 'text-amber-400';
    case 4: return 'text-green-400';
    case 3: return 'text-blue-400';
    case 0: return 'text-red-400';
    default: return 'text-slate-400';
  }
}
