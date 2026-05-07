import type { Lang } from './i18n';

type Score = { homeGoals: number; awayGoals: number };

export function calculatePoints(pred: Score, result: Score): number {
  // Exact result 100%
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

const LABELS: Record<Lang, Record<string, string>> = {
  ar: {
    pending:   'في الانتظار',
    exact:     'نتيجة دقيقة ⭐',
    dirAndGap: 'اتجاه + فارق ✅',
    dirOnly:   'اتجاه صحيح 👍',
    wrong:     'غلط كلياً ❌',
  },
  en: {
    pending:   'Pending',
    exact:     'Exact score ⭐',
    dirAndGap: 'Correct winner & goal diff ✅',
    dirOnly:   'Correct winner 👍',
    wrong:     'Wrong prediction ❌',
  },
};

export function getPointsLabel(points: number | null, lang: Lang = 'ar'): string {
  const l = LABELS[lang];
  if (points === null) return l.pending;
  switch (points) {
    case 5: return l.exact;
    case 4: return l.dirAndGap;
    case 3: return l.dirOnly;
    case 0: return l.wrong;
    default: return lang === 'ar' ? `${points} نقاط` : `${points} pts`;
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
