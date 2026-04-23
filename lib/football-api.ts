const API_KEY = process.env.FOOTBALL_API_KEY!;
const API_HOST = process.env.FOOTBALL_API_HOST!;
const BASE_URL = `https://${API_HOST}`;

// معرفات الدوريات حسب الوثيقة
export const LEAGUES = {
  SAUDI: { id: 307, name: 'دوري روشن السعودي', flag: '🇸🇦', color: 'bg-green-700' },
  PREMIER: { id: 39, name: 'الدوري الإنجليزي الممتاز', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'bg-purple-700' },
  LALIGA: { id: 140, name: 'الدوري الإسباني', flag: '🇪🇸', color: 'bg-red-700' },
  SERIE_A: { id: 135, name: 'الدوري الإيطالي', flag: '🇮🇹', color: 'bg-blue-800' },
  UCL: { id: 2, name: 'دوري أبطال أوروبا', flag: '🌟', color: 'bg-blue-600' },
} as const;

export type LeagueKey = keyof typeof LEAGUES;

async function fetchFootball(endpoint: string, revalidate = 300) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    },
    next: { revalidate }, // كاش قابل للضبط — fixtures: 5 دقائق، standings: ساعة
  });

  if (!res.ok) throw new Error(`Football API error: ${res.status}`);
  const data = await res.json();

  // الخطة المجانية لا تدعم season=2025+ — نرجع مصفوفة فارغة عوضاً عن خطأ
  if (data.errors && Object.keys(data.errors).length > 0) {
    console.warn('Football API warning:', data.errors);
    return [];
  }

  return data.response;
}

// معرفات الدوريات المدعومة للفلتر
const SUPPORTED_LEAGUE_IDS = new Set(Object.values(LEAGUES).map(l => l.id));

// مباريات حسب التاريخ — نجلب كل المباريات ثم نفلتر محلياً
// السبب: الخطة المجانية لا تدعم season=2025 مع فلتر league
export async function getFixturesByDate(date: string, leagueId?: number) {
  const all = await fetchFootball(`/fixtures?date=${date}`);
  if (!Array.isArray(all)) return [];

  // فلتر: الدوريات المدعومة فقط (أو دوري محدد إن طُلب)
  if (leagueId) {
    return all.filter((f: FixtureData) => f.league.id === leagueId);
  }
  return all.filter((f: FixtureData) => SUPPORTED_LEAGUE_IDS.has(f.league.id as 2 | 307 | 39 | 140 | 135));
}

// مباريات اليوم
export async function getTodayFixtures(leagueId?: number) {
  const today = new Date().toISOString().split('T')[0];
  return getFixturesByDate(today, leagueId);
}

// مباريات الـ 48 ساعة القادمة (للتوقعات)
export async function getUpcomingFixtures(leagueId?: number) {
  const results = [];
  for (let i = 0; i < 2; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const fixtures = await getFixturesByDate(dateStr, leagueId);
    results.push(...fixtures);
  }
  return results;
}

// ترتيب الدوري
// ملاحظة: الخطة المجانية تدعم حتى season=2024 (= موسم 2024/25 الحالي)
export async function getStandings(leagueId: number, season = 2024) {
  const data = await fetchFootball(`/standings?league=${leagueId}&season=${season}`, 3600); // كاش ساعة
  if (!Array.isArray(data) || data.length === 0) return [];
  return data?.[0]?.league?.standings?.[0] ?? [];
}

// أفضل الهدافين
// ملاحظة: الخطة المجانية تدعم حتى season=2024 (= موسم 2024/25 الحالي)
export async function getTopScorers(leagueId: number, season = 2024) {
  const data = await fetchFootball(`/players/topscorers?league=${leagueId}&season=${season}`, 3600);
  return Array.isArray(data) ? data : [];
}

// تفاصيل مباراة
export async function getFixtureById(fixtureId: number) {
  const data = await fetchFootball(`/fixtures?id=${fixtureId}`);
  return data?.[0] ?? null;
}

// أبرز مباريات اليوم من جميع الدوريات
export async function getFeaturedFixtures() {
  const leagueIds = Object.values(LEAGUES).map(l => l.id);
  const today = new Date().toISOString().split('T')[0];

  const allFixtures = await Promise.allSettled(
    leagueIds.map(id => getFixturesByDate(today, id))
  );

  return allFixtures
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<unknown[]>).value)
    .slice(0, 10);
}

// تنسيق وقت المباراة
export function formatMatchTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  });
}

// تنسيق تاريخ المباراة
export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });
}

// حالة المباراة
export function getMatchStatus(fixture: { fixture: { status: { short: string; elapsed: number | null } } }) {
  const { short, elapsed } = fixture.fixture.status;
  switch (short) {
    case 'NS': return { label: 'لم تبدأ', color: 'text-slate-400', live: false };
    case '1H': return { label: `الشوط الأول - ${elapsed}'`, color: 'text-green-400', live: true };
    case 'HT': return { label: 'استراحة', color: 'text-yellow-400', live: true };
    case '2H': return { label: `الشوط الثاني - ${elapsed}'`, color: 'text-green-400', live: true };
    case 'ET': return { label: `وقت إضافي - ${elapsed}'`, color: 'text-orange-400', live: true };
    case 'P': return { label: 'ركلات الترجيح', color: 'text-orange-400', live: true };
    case 'FT': return { label: 'انتهت', color: 'text-slate-500', live: false };
    case 'AET': return { label: 'انتهت (إضافي)', color: 'text-slate-500', live: false };
    case 'PEN': return { label: 'انتهت (ركلات)', color: 'text-slate-500', live: false };
    case 'CANC': return { label: 'ملغاة', color: 'text-red-400', live: false };
    case 'PST': return { label: 'مؤجلة', color: 'text-orange-400', live: false };
    default: return { label: short, color: 'text-slate-400', live: false };
  }
}

export type FixtureData = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
};
