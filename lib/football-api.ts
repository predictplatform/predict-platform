import { unstable_cache } from 'next/cache';

const API_TOKEN = process.env.SPORTMONKS_TOKEN!;
const BASE_URL  = 'https://api.sportmonks.com/v3/football';

// مدد الـ Cache بالثواني
const TTL = {
  FIXTURES:    60,            // دقيقة واحدة — يغطي المباريات الحية
  HISTORICAL:  2 * 60 * 60,  // ساعتان — للـ cron (مباريات انتهت)
  STANDINGS:  24 * 60 * 60,  // 24 ساعة
  TOPSCORERS: 24 * 60 * 60,  // 24 ساعة
} as const;

// يُضاف لكل cache key — غيّره في Vercel env vars لمسح الكاش فوراً
const CV = process.env.CACHE_VERSION ?? 'v1';

// حالات المباريات الحية
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE']);

// ─── معرّفات الدوريات (Sportmonks) ───────────────────────────────────────────
export const LEAGUES = {
  SAUDI:    { id: 944, name: 'دوري روشن السعودي',        flag: '🇸🇦', color: 'bg-green-700' },
  PREMIER:  { id: 8,   name: 'الدوري الإنجليزي الممتاز', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'bg-purple-700' },
  LALIGA:   { id: 564, name: 'الدوري الإسباني',           flag: '🇪🇸', color: 'bg-red-700' },
  SERIE_A:  { id: 384, name: 'الدوري الإيطالي',           flag: '🇮🇹', color: 'bg-blue-800' },
  BUNDESLIGA: { id: 82, name: 'الدوري الألماني',          flag: '🇩🇪', color: 'bg-yellow-600' },
} as const;

export type LeagueKey = keyof typeof LEAGUES;

const SUPPORTED_LEAGUE_IDS = new Set(Object.values(LEAGUES).map(l => l.id));

// season_id الحالي (2025/26) لكل دوري
const CURRENT_SEASON: Record<number, number> = {
  944: 26276,  // Saudi Pro League
  8:   25583,  // Premier League
  564: 25659,  // La Liga
  384: 25533,  // Serie A
  82:  25646,  // Bundesliga
};

// ─── تحويل state.state من Sportmonks إلى short code متوافق مع الكود الحالي ──
function toShortStatus(state: string): string {
  switch (state) {
    case 'NS':                return 'NS';
    case 'INPLAY_1ST_HALF':   return '1H';
    case 'HT':                return 'HT';
    case 'INPLAY_2ND_HALF':   return '2H';
    case 'INPLAY_ET':         return 'ET';
    case 'EXTRA_TIME_BREAK':  return 'BT';
    case 'INPLAY_PENALTIES':  return 'P';
    case 'PEN_BREAK':         return 'BT';
    case 'BREAK':             return 'BT';
    case 'FT':                return 'FT';
    case 'AET':               return 'AET';
    case 'FT_PEN':            return 'PEN';
    case 'POSTPONED':         return 'PST';
    case 'CANCELLED':         return 'CANC';
    case 'SUSPENDED':         return 'SUSP';
    case 'ABANDONED':         return 'ABD';
    case 'AWARDED':           return 'AWD';
    case 'WO':                return 'WO';
    default:                  return 'NS';
  }
}

// ─── استخراج النتيجة من مصفوفة scores ────────────────────────────────────────
function extractScore(
  scores: SmRawScore[],
  side: 'home' | 'away',
  desc: 'CURRENT' | '1ST_HALF' | '2ND_HALF'
): number | null {
  const s = scores.find(
    x => x.description === desc && x.score.participant === side
  );
  return s?.score.goals ?? null;
}

// ─── تحويل fixture خام من Sportmonks إلى FixtureData ─────────────────────────
function mapFixture(raw: SmRawFixture): FixtureData | null {
  const home = raw.participants?.find(p => p.meta?.location === 'home');
  const away = raw.participants?.find(p => p.meta?.location === 'away');
  if (!home || !away) return null;

  const scores   = raw.scores ?? [];
  const stateStr = raw.state?.state ?? 'NS';
  const status   = toShortStatus(stateStr);

  return {
    fixture: {
      id:     raw.id,
      date:   raw.starting_at,
      status: { short: status, elapsed: null },
    },
    league: {
      id:      raw.league_id,
      name:    raw.league?.name ?? '',
      logo:    raw.league?.image_path ?? '',
      country: '',
    },
    teams: {
      home: { id: home.id, name: home.name, logo: home.image_path },
      away: { id: away.id, name: away.name, logo: away.image_path },
    },
    goals: {
      home: extractScore(scores, 'home', 'CURRENT'),
      away: extractScore(scores, 'away', 'CURRENT'),
    },
    score: {
      halftime: {
        home: extractScore(scores, 'home', '1ST_HALF'),
        away: extractScore(scores, 'away', '1ST_HALF'),
      },
      fulltime: {
        home: extractScore(scores, 'home', 'CURRENT'),
        away: extractScore(scores, 'away', 'CURRENT'),
      },
    },
  };
}

// ─── Raw fetch مباشر للـ API (بدون cache — unstable_cache يتولى ذلك) ─────────
async function rawFetch(endpoint: string): Promise<unknown> {
  const url = `${BASE_URL}${endpoint}`;
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}api_token=${API_TOKEN}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Sportmonks API error: ${res.status} ${url}`);
  return res.json();
}

// paginated fetch — يجمع كل الصفحات في مصفوفة واحدة
async function rawFetchAll(endpoint: string): Promise<unknown[]> {
  const sep = endpoint.includes('?') ? '&' : '?';
  let page = 1;
  const all: unknown[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url    = `${BASE_URL}${endpoint}${sep}api_token=${API_TOKEN}&per_page=50&page=${page}`;
    const res    = await fetch(url, { cache: 'no-store' });
    if (!res.ok) break;
    const json   = await res.json() as { data?: unknown[]; pagination?: { has_more?: boolean } };
    const items  = json.data ?? [];
    all.push(...items);
    if (!json.pagination?.has_more) break;
    page++;
    if (page > 10) break; // حد أقصى 500 عنصر
  }
  return all;
}

// ─── Cached fetchers (unstable_cache يمنع thundering herd) ───────────────────

const _cachedFixturesByDate = unstable_cache(
  async (date: string): Promise<SmRawFixture[]> => {
    const data = await rawFetch(
      `/fixtures/date/${date}?include=participants;scores;league;state&per_page=100`
    ) as { data?: SmRawFixture[] };
    return data.data ?? [];
  },
  [`sm-fixtures-date-${CV}`],
  { revalidate: TTL.FIXTURES }
);

const _cachedHistoricalFixtures = unstable_cache(
  async (date: string): Promise<SmRawFixture[]> => {
    const data = await rawFetch(
      `/fixtures/date/${date}?include=participants;scores;league;state&per_page=100`
    ) as { data?: SmRawFixture[] };
    return data.data ?? [];
  },
  [`sm-fixtures-historical-${CV}`],
  { revalidate: TTL.HISTORICAL }
);

const _cachedFixtureById = unstable_cache(
  async (id: string): Promise<SmRawFixture | null> => {
    const data = await rawFetch(
      `/fixtures/${id}?include=participants;scores;league;state`
    ) as { data?: SmRawFixture };
    return data.data ?? null;
  },
  [`sm-fixture-id-${CV}`],
  { revalidate: TTL.FIXTURES }
);

const _cachedStandings = unstable_cache(
  async (seasonId: number): Promise<unknown[]> =>
    rawFetchAll(`/standings/seasons/${seasonId}?include=participant;details`),
  [`sm-standings-${CV}`],
  { revalidate: TTL.STANDINGS }
);

const _cachedTopScorers = unstable_cache(
  async (seasonId: number): Promise<unknown[]> =>
    rawFetchAll(
      `/topscorers/seasons/${seasonId}?include=player;participant&per_page=20`
    ),
  [`sm-topscorers-${CV}`],
  { revalidate: TTL.TOPSCORERS }
);

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getFixturesByDate(date: string, leagueId?: number): Promise<FixtureData[]> {
  const raw = await _cachedFixturesByDate(date);
  return raw
    .filter(f => leagueId ? f.league_id === leagueId : SUPPORTED_LEAGUE_IDS.has(f.league_id as never))
    .map(mapFixture)
    .filter((f): f is FixtureData => f !== null);
}

export async function getHistoricalFixtures(date: string, leagueId?: number): Promise<FixtureData[]> {
  const raw = await _cachedHistoricalFixtures(date);
  return raw
    .filter(f => leagueId ? f.league_id === leagueId : SUPPORTED_LEAGUE_IDS.has(f.league_id as never))
    .map(mapFixture)
    .filter((f): f is FixtureData => f !== null);
}

export async function getTodayFixtures(leagueId?: number): Promise<FixtureData[]> {
  const today = new Date().toISOString().split('T')[0];
  return getFixturesByDate(today, leagueId);
}

export async function getUpcomingFixtures(leagueId?: number): Promise<FixtureData[]> {
  const results: FixtureData[] = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    results.push(...await getFixturesByDate(dateStr, leagueId));
  }
  return results;
}

export async function getFeaturedFixtures(): Promise<FixtureData[]> {
  const today = new Date().toISOString().split('T')[0];
  return getFixturesByDate(today);
}

export async function getFixtureById(fixtureId: number): Promise<FixtureData | null> {
  const raw = await _cachedFixtureById(String(fixtureId));
  return raw ? mapFixture(raw) : null;
}

// ─── Standings ────────────────────────────────────────────────────────────────
// type_id mapping (Sportmonks standing details)
const D = {
  PLAYED: 129, WINS: 130, DRAWS: 131, LOSSES: 132,
  GOALS_FOR: 133, GOALS_AGAINST: 134,
} as const;

export async function getStandings(leagueId: number, _season?: number) {
  const seasonId = CURRENT_SEASON[leagueId];
  if (!seasonId) return [];

  const raw = await _cachedStandings(seasonId) as SmRawStanding[];

  return raw
    .sort((a, b) => a.position - b.position)
    .map(s => {
      const det = (s.details ?? []).reduce<Record<number, number>>((acc, d) => {
        acc[d.type_id] = d.value;
        return acc;
      }, {});
      const goalsFor     = det[D.GOALS_FOR]     ?? 0;
      const goalsAgainst = det[D.GOALS_AGAINST] ?? 0;
      return {
        rank:        s.position,
        team: {
          id:   s.participant?.id   ?? s.participant_id,
          name: s.participant?.name ?? '',
          logo: s.participant?.image_path ?? '',
        },
        points:    s.points,
        goalsDiff: goalsFor - goalsAgainst,
        group:     '',
        form:      '',
        status:    '',
        description: null as string | null,
        all: {
          played: det[D.PLAYED]  ?? 0,
          win:    det[D.WINS]    ?? 0,
          draw:   det[D.DRAWS]   ?? 0,
          lose:   det[D.LOSSES]  ?? 0,
          goals: { for: goalsFor, against: goalsAgainst },
        },
      };
    });
}

// ─── Top Scorers ──────────────────────────────────────────────────────────────
export async function getTopScorers(leagueId: number, _season?: number) {
  const seasonId = CURRENT_SEASON[leagueId];
  if (!seasonId) return [];

  const raw = await _cachedTopScorers(seasonId) as SmRawTopScorer[];

  return raw.map(s => ({
    player: {
      id:          s.player?.id ?? s.player_id,
      name:        s.player?.display_name ?? s.player?.name ?? '',
      photo:       s.player?.image_path ?? '',
      nationality: '',
    },
    statistics: [{
      team: {
        id:   s.participant?.id   ?? s.participant_id,
        name: s.participant?.name ?? '',
        logo: s.participant?.image_path ?? '',
      },
      goals:  { total: s.total, assists: null },
      games:  { appearences: null },
    }],
  }));
}

// ─── Cache-Control header للـ CDN ─────────────────────────────────────────────
export function getCacheHeader(fixtures: FixtureData[]): string {
  const hasLive = fixtures.some(f => LIVE_STATUSES.has(f.fixture.status.short));
  const ttl = hasLive ? 60 : TTL.FIXTURES;
  return `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatMatchTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ar-SA', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh',
  });
}

export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });
}

export function getMatchStatus(fixture: { fixture: { status: { short: string; elapsed: number | null } } }) {
  const { short, elapsed } = fixture.fixture.status;
  switch (short) {
    case 'NS':   return { label: 'لم تبدأ',                    color: 'text-slate-400',  live: false };
    case '1H':   return { label: elapsed ? `الشوط الأول - ${elapsed}'` : 'الشوط الأول',   color: 'text-green-400',  live: true  };
    case 'HT':   return { label: 'استراحة',                     color: 'text-yellow-400', live: true  };
    case '2H':   return { label: elapsed ? `الشوط الثاني - ${elapsed}'` : 'الشوط الثاني', color: 'text-green-400',  live: true  };
    case 'ET':   return { label: elapsed ? `وقت إضافي - ${elapsed}'` : 'وقت إضافي',       color: 'text-orange-400', live: true  };
    case 'P':    return { label: 'ركلات الترجيح',              color: 'text-orange-400', live: true  };
    case 'FT':   return { label: 'انتهت',                       color: 'text-slate-500',  live: false };
    case 'AET':  return { label: 'انتهت (إضافي)',              color: 'text-slate-500',  live: false };
    case 'PEN':  return { label: 'انتهت (ركلات)',              color: 'text-slate-500',  live: false };
    case 'CANC': return { label: 'ملغاة',                       color: 'text-red-400',    live: false };
    case 'PST':  return { label: 'مؤجلة',                       color: 'text-orange-400', live: false };
    default:     return { label: short,                          color: 'text-slate-400',  live: false };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
    fulltime:  { home: number | null; away: number | null };
  };
};

// ─── Raw Sportmonks types (internal) ─────────────────────────────────────────

type SmRawScore = {
  description: string;
  score: { goals: number; participant: 'home' | 'away' };
};

type SmRawParticipant = {
  id: number;
  name: string;
  image_path: string;
  meta?: { location?: 'home' | 'away' };
};

type SmRawFixture = {
  id: number;
  league_id: number;
  starting_at: string;
  state_id: number;
  state?: { id: number; state: string };
  league?: { id: number; name: string; image_path: string };
  participants?: SmRawParticipant[];
  scores?: SmRawScore[];
};

type SmRawStanding = {
  id: number;
  participant_id: number;
  position: number;
  points: number;
  participant?: { id: number; name: string; image_path: string };
  details?: Array<{ type_id: number; value: number }>;
};

type SmRawTopScorer = {
  player_id: number;
  participant_id: number;
  total: number;
  player?: {
    id: number;
    name: string;
    display_name?: string;
    image_path: string;
  };
  participant?: { id: number; name: string; image_path: string };
};
