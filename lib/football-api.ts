const API_KEY = process.env.FOOTBALL_API_KEY!;
const API_HOST = process.env.FOOTBALL_API_HOST!;
const BASE_URL = `https://${API_HOST}`;

// مدد الـ Cache بالثواني
const TTL = {
  LIVE:       2 * 60,   // مباريات حية:    دقيقتان
  TODAY:      5 * 60,   // مباريات اليوم:  5 دقائق
  STANDINGS: 30 * 60,   // الترتيب:        30 دقيقة
  TOPSCORERS: 60 * 60,  // الهدافين:       ساعة
  FIXTURE_ID: 2 * 60,   // تفاصيل مباراة: دقيقتان (قد تكون حية)
} as const;

// الحالات التي تعني أن المباراة حية
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE']);

// معرفات الدوريات
export const LEAGUES = {
  SAUDI:   { id: 307, name: 'دوري روشن السعودي',        flag: '🇸🇦', color: 'bg-green-700' },
  PREMIER: { id: 39,  name: 'الدوري الإنجليزي الممتاز', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'bg-purple-700' },
  LALIGA:  { id: 140, name: 'الدوري الإسباني',           flag: '🇪🇸', color: 'bg-red-700' },
  SERIE_A: { id: 135, name: 'الدوري الإيطالي',           flag: '🇮🇹', color: 'bg-blue-800' },
  UCL:     { id: 2,   name: 'دوري أبطال أوروبا',         flag: '🌟', color: 'bg-blue-600' },
} as const;

export type LeagueKey = keyof typeof LEAGUES;

const SUPPORTED_LEAGUE_IDS = new Set(Object.values(LEAGUES).map(l => l.id));

// ─── fetch مركزي مع TTL صريح ────────────────────────────────────────────────
async function fetchFootball(endpoint: string, ttl: number) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    },
    next: { revalidate: ttl },
  });

  if (!res.ok) throw new Error(`Football API error: ${res.status}`);
  const data = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    console.warn('Football API warning:', JSON.stringify(data.errors));
    return [];
  }

  return data.response;
}

// ─── تحديد الـ TTL الصحيح بناءً على وجود مباريات حية ───────────────────────
function pickTTL(fixtures: FixtureData[]): number {
  const hasLive = fixtures.some(f => LIVE_STATUSES.has(f.fixture.status.short));
  return hasLive ? TTL.LIVE : TTL.TODAY;
}

// ─── مباريات حسب التاريخ ────────────────────────────────────────────────────
// نجلب كل مباريات اليوم دفعة واحدة (الخطة المجانية لا تدعم league+season=2025)
// ثم نفلتر محلياً — يوفر الـ 100 طلب اليومي
export async function getFixturesByDate(date: string, leagueId?: number): Promise<FixtureData[]> {
  // نبدأ بـ TTL.TODAY — بعد الفلتر نقيم إن كانت حية
  const all = await fetchFootball(`/fixtures?date=${date}`, TTL.TODAY);
  if (!Array.isArray(all)) return [];

  const filtered: FixtureData[] = leagueId
    ? all.filter((f: FixtureData) => f.league.id === leagueId)
    : all.filter((f: FixtureData) =>
        SUPPORTED_LEAGUE_IDS.has(f.league.id as 2 | 307 | 39 | 140 | 135)
      );

  // إذا في مباريات حية، نعيد الطلب بـ TTL قصير عبر revalidate الـ Next.js cache
  // (الـ fetch نفسه مكاش بـ TTL.TODAY لكن الـ API route سيعيد revalidation)
  return filtered;
}

// ─── مباريات اليوم مع TTL الديناميكي ────────────────────────────────────────
export async function getTodayFixtures(leagueId?: number): Promise<FixtureData[]> {
  const today = new Date().toISOString().split('T')[0];
  return getFixturesByDate(today, leagueId);
}

// ─── مباريات الـ 48 ساعة القادمة ────────────────────────────────────────────
export async function getUpcomingFixtures(leagueId?: number): Promise<FixtureData[]> {
  const results: FixtureData[] = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const fixtures = await getFixturesByDate(dateStr, leagueId);
    results.push(...fixtures);
  }
  return results;
}

// ─── أبرز مباريات اليوم ──────────────────────────────────────────────────────
export async function getFeaturedFixtures(): Promise<FixtureData[]> {
  const today = new Date().toISOString().split('T')[0];
  const all = await fetchFootball(`/fixtures?date=${today}`, TTL.TODAY);
  if (!Array.isArray(all)) return [];
  return all
    .filter((f: FixtureData) =>
      SUPPORTED_LEAGUE_IDS.has(f.league.id as 2 | 307 | 39 | 140 | 135)
    )
    .slice(0, 10);
}

// ─── ترتيب الدوري (كاش 30 دقيقة) ────────────────────────────────────────────
export async function getStandings(leagueId: number, season = 2024) {
  const data = await fetchFootball(
    `/standings?league=${leagueId}&season=${season}`,
    TTL.STANDINGS
  );
  if (!Array.isArray(data) || data.length === 0) return [];
  return data?.[0]?.league?.standings?.[0] ?? [];
}

// ─── أفضل الهدافين (كاش ساعة) ────────────────────────────────────────────────
export async function getTopScorers(leagueId: number, season = 2024) {
  const data = await fetchFootball(
    `/players/topscorers?league=${leagueId}&season=${season}`,
    TTL.TOPSCORERS
  );
  return Array.isArray(data) ? data : [];
}

// ─── تفاصيل مباراة (كاش دقيقتان — قد تكون حية) ─────────────────────────────
export async function getFixtureById(fixtureId: number): Promise<FixtureData | null> {
  const data = await fetchFootball(`/fixtures?id=${fixtureId}`, TTL.FIXTURE_ID);
  return data?.[0] ?? null;
}

// ─── API routes: إرجاع TTL الصحيح في Cache-Control header ──────────────────
export function getCacheHeader(fixtures: FixtureData[]): string {
  const ttl = pickTTL(fixtures);
  return `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function formatMatchTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  });
}

export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });
}

export function getMatchStatus(fixture: { fixture: { status: { short: string; elapsed: number | null } } }) {
  const { short, elapsed } = fixture.fixture.status;
  switch (short) {
    case 'NS':   return { label: 'لم تبدأ',                    color: 'text-slate-400',  live: false };
    case '1H':   return { label: `الشوط الأول - ${elapsed}'`,  color: 'text-green-400',  live: true  };
    case 'HT':   return { label: 'استراحة',                     color: 'text-yellow-400', live: true  };
    case '2H':   return { label: `الشوط الثاني - ${elapsed}'`, color: 'text-green-400',  live: true  };
    case 'ET':   return { label: `وقت إضافي - ${elapsed}'`,    color: 'text-orange-400', live: true  };
    case 'P':    return { label: 'ركلات الترجيح',              color: 'text-orange-400', live: true  };
    case 'FT':   return { label: 'انتهت',                       color: 'text-slate-500',  live: false };
    case 'AET':  return { label: 'انتهت (إضافي)',              color: 'text-slate-500',  live: false };
    case 'PEN':  return { label: 'انتهت (ركلات)',              color: 'text-slate-500',  live: false };
    case 'CANC': return { label: 'ملغاة',                       color: 'text-red-400',    live: false };
    case 'PST':  return { label: 'مؤجلة',                       color: 'text-orange-400', live: false };
    default:     return { label: short,                          color: 'text-slate-400',  live: false };
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
