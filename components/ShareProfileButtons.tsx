'use client';

const SITE_URL = 'https://dawri-tawaquat.com';

interface ShareStats {
  total:    number;
  correct:  number;
  wrong:    number;
  accuracy: number; // 0-100
}

interface Props {
  rank?:  number;   // اختياري — يظهر في الليدربورد فقط
  stats:  ShareStats;
}

function buildText(rank: number | undefined, stats: ShareStats): string {
  const rankLine  = rank ? `\u{1F3C6} أنا في المركز #${rank} في دوري التوقعات!\n\n` : '';
  return (
    rankLine +
    `\u{1F4CA} إحصائياتي:\n` +
    `\u26BD\uFE0F إجمالي التوقعات: ${stats.total}\n` +
    `\u2705 توقعات صحيحة: ${stats.correct}\n` +
    `\u274C توقعات خاطئة: ${stats.wrong}\n` +
    `\u{1F3AF} نسبة الدقة: ${stats.accuracy}%\n\n` +
    `تقدر تتفوق عليّ؟ \u{1F60F}\n` +
    `\u{1F447}\uFE0F سجّل وتنافس معي\n` +
    SITE_URL
  );
}

export function ShareProfileButtons({ rank, stats }: Props) {
  const text         = buildText(rank, stats);
  const encoded      = encodeURIComponent(text);
  const twitterUrl   = `https://twitter.com/intent/tweet?text=${encoded}`;
  const whatsappUrl  = `https://api.whatsapp.com/send?text=${encoded}`;

  return (
    <div className="flex gap-2">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-900
                   text-white text-xs font-bold transition-colors border border-slate-600"
        aria-label="شارك على تويتر"
      >
        <span className="text-sm font-black leading-none">𝕏</span>
        شارك
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600
                   text-white text-xs font-bold transition-colors"
        aria-label="شارك على واتساب"
      >
        <span className="text-sm leading-none">💬</span>
        واتساب
      </a>
    </div>
  );
}
