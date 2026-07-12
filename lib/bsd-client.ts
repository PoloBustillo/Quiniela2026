/**
 * BSD Sports API v2 client
 *
 * Wrapper seguro y tolerante a fallos.
 * NUNCA lanza errores al llamador — siempre devuelve null en caso de fallo.
 * El sistema existente sigue funcionando aunque BSD falle completamente.
 *
 * Docs: https://sports.bzzoiro.com/docs/v2/
 */

const BSD_BASE = "https://sports.bzzoiro.com/api/v2";
const BSD_TOKEN = process.env.BSD_API_TOKEN ?? "";
const REQUEST_TIMEOUT_MS = 8000; // 8s timeout

// ── Tipos mínimos necesarios ─────────────────────────────────────────────────

export type BsdMatchStatus =
  | "notstarted"
  | "inprogress"
  | "1st_half"
  | "2nd_half"
  | "halftime"
  | "extra_time"
  | "penalties"
  | "finished"
  | "postponed"
  | "cancelled";

export interface BsdExtraTimeScore {
  home: number;
  away: number;
}

export interface BsdLiveEvent {
  id: number;
  league_id: number;
  home_team: string;
  away_team: string;
  event_date: string;
  status: BsdMatchStatus;
  period: string | null;
  current_minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  extra_time_score?: BsdExtraTimeScore | null;
  live_websocket: boolean;
  last_updated: string;
}

export interface BsdEventDetail {
  id: number;
  league_id: number;
  home_team: string;
  away_team: string;
  event_date: string;
  status: BsdMatchStatus;
  period: string | null;
  current_minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  extra_time_score?: BsdExtraTimeScore | null;
  penalty_shootout: null | {
    home: number;
    away: number;
  };
}

export interface BsdLiveResponse {
  count: number;
  events: BsdLiveEvent[];
}

// ── Fetch helper (con timeout y manejo de errores) ───────────────────────────

async function bsdFetch<T>(path: string): Promise<T | null> {
  if (!BSD_TOKEN) {
    console.warn("[BSD] BSD_API_TOKEN no configurado — sync desactivado");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BSD_BASE}${path}`, {
      headers: {
        Authorization: `Token ${BSD_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      // next.js cache: no-store para siempre tener datos frescos
      cache: "no-store",
    });

    if (!res.ok) {
      // 429 = rate limit, 503 = BSD down → no lanzar, sólo loggear
      console.warn(`[BSD] HTTP ${res.status} en ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[BSD] Timeout en ${path}`);
    } else {
      console.warn(`[BSD] Error en ${path}:`, err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Endpoints públicos ───────────────────────────────────────────────────────

/**
 * Partidos actualmente en vivo (filtrado por liga Mundial 2026).
 * Redis TTL 30s en BSD — no hacer polling más rápido que eso.
 */
export async function getLiveMatches(): Promise<BsdLiveEvent[]> {
  const data = await bsdFetch<BsdLiveResponse>(
    "/events/live/?league_id=27", // league_id 27 = FIFA World Cup 2026
  );
  return data?.events ?? [];
}

/**
 * Detalle de un partido específico.
 */
export async function getEventDetail(
  bsdEventId: number,
): Promise<BsdEventDetail | null> {
  return bsdFetch<BsdEventDetail>(`/events/${bsdEventId}/`);
}

/**
 * Partidos del Mundial por rango de fechas.
 */
export async function getWorldCupMatches(
  dateFrom: string, // YYYY-MM-DD
  dateTo: string,
): Promise<BsdEventDetail[]> {
  const data = await bsdFetch<{
    count: number;
    results: BsdEventDetail[];
  }>(
    `/events/?league_id=27&season_id=188&date_from=${dateFrom}&date_to=${dateTo}&limit=200`,
  );
  return data?.results ?? [];
}

// ── Tipos v2 sub-resources ────────────────────────────────────────────────────

interface BsdRatioStat {
  value: number;
  total: number;
  pct: number;
}

export interface BsdTeamStats {
  ball_possession: number | null;
  total_shots: number | null;
  shots_on_target: number | null;
  corner_kicks: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  offsides: number | null;
  xg?: { actual: number | null } | null;
  pass_accuracy_pct?: number | null;
  crosses?: BsdRatioStat | null;
  attack?: number | null;
  dangerous_attack?: number | null;
}

export interface BsdShotmapEntry {
  min: number;
  type: string;
  sit: string;
  body: string;
  home: boolean;
  xg: number;
  pos: { x: number; y: number };
}

export interface BsdMomentumEntry {
  m: number;
  v: number;
}

export interface BsdEventStatsData {
  event_id: number;
  stats: { home: BsdTeamStats; away: BsdTeamStats } | null;
  shotmap: BsdShotmapEntry[] | null;
  momentum: BsdMomentumEntry[] | null;
}

export interface BsdIncident {
  type: string;
  minute: number;
  player?: string | null;
  player_id?: number | null;
  is_home?: boolean;
  card_type?: string | null;
  player_in?: string | null;
  player_in_id?: number | null;
  player_out?: string | null;
  player_out_id?: number | null;
  assist?: string | null;
  home_score?: number | null;
  away_score?: number | null;
}

export interface BsdEventIncidentsData {
  event_id: number;
  incidents: BsdIncident[];
}

export interface BsdLineupPlayer {
  id: number;
  name: string;
  short_name: string;
  position: string;
  jersey_number: number | null;
  ai_score?: number | null;
}

export interface BsdLineupsTeam {
  team_id: number;
  team_name: string;
  formation: string | null;
  confidence?: number | null;
  players: BsdLineupPlayer[];
  substitutes: BsdLineupPlayer[];
}

export interface BsdLineupsData {
  event_id: number;
  lineup_status: "confirmed" | "predicted" | "unavailable";
  beta: boolean;
  lineups: { home: BsdLineupsTeam; away: BsdLineupsTeam } | null;
  unavailable_players: {
    home: Array<{ name: string; status?: string; reason?: string }>;
    away: Array<{ name: string; status?: string; reason?: string }>;
  } | null;
  updated_at: string | null;
}

export interface BsdPlayerStatItem {
  id: number;
  player_id: number;
  event_id: number;
  team_id: number;
  minutes_played: number;
  rating: number | null;
  goals: number;
  goal_assist: number;
  expected_goals: number | null;
  total_shots: number;
  shots_on_target: number;
  total_pass: number;
  accurate_pass: number;
  key_pass: number;
  yellow_card: number;
  red_card: number;
  saves: number | null;
  total_tackle: number;
  interception: number;
}

export interface BsdPlayerStatsData {
  event_id: number;
  count: number;
  player_stats: BsdPlayerStatItem[];
}

export interface BsdConsensusOdds {
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  over_25_goals: number | null;
  under_25_goals: number | null;
  btts_yes: number | null;
  btts_no: number | null;
}

export interface BsdEventOddsData {
  event_id: number;
  odds: BsdConsensusOdds;
}

export interface BsdPredictionMarkets {
  match_result: {
    prob_home: number;
    prob_draw: number;
    prob_away: number;
    predicted: "H" | "D" | "A";
  };
  expected_goals: { home: number; away: number };
  over_under: {
    prob_over_15: number | null;
    prob_over_25: number;
    prob_over_35: number | null;
  };
  btts: { prob_yes: number };
  score: { most_likely: string };
}

export interface BsdPredictionData {
  id: number;
  created_at: string;
  event: {
    id: number;
    home_team: string;
    away_team: string;
    event_date: string;
    status: string;
    league_id: number;
    league_name: string;
  };
  markets: BsdPredictionMarkets;
  recommendations: {
    favorite: "H" | "A" | null;
    favorite_prob: number | null;
    bet_favorite: boolean;
    over_15: boolean;
    over_25: boolean;
    over_35: boolean;
    btts: boolean;
    winner: boolean;
  };
  model: { confidence: number; version: string };
}

export interface BsdMetadataData {
  event_id: number;
  funfacts: Array<{ type_id: number; sentence: string }>;
  ai_preview: { text: string; generated_at: string } | null;
}

// ── Fetchers v2 sub-resources ─────────────────────────────────────────────────

export async function getEventStats(
  bsdEventId: number,
): Promise<BsdEventStatsData | null> {
  return bsdFetch<BsdEventStatsData>(`/events/${bsdEventId}/stats/`);
}

export async function getEventIncidents(
  bsdEventId: number,
): Promise<BsdEventIncidentsData | null> {
  return bsdFetch<BsdEventIncidentsData>(`/events/${bsdEventId}/incidents/`);
}

export async function getEventLineups(
  bsdEventId: number,
): Promise<BsdLineupsData | null> {
  return bsdFetch<BsdLineupsData>(`/events/${bsdEventId}/lineups/`);
}

export async function getEventPlayerStats(
  bsdEventId: number,
): Promise<BsdPlayerStatsData | null> {
  return bsdFetch<BsdPlayerStatsData>(`/events/${bsdEventId}/player-stats/`);
}

export async function getEventOdds(
  bsdEventId: number,
): Promise<BsdEventOddsData | null> {
  return bsdFetch<BsdEventOddsData>(`/events/${bsdEventId}/odds/`);
}

export async function getEventPrediction(
  bsdEventId: number,
): Promise<BsdPredictionData | null> {
  return bsdFetch<BsdPredictionData>(`/events/${bsdEventId}/prediction/`);
}

export async function getEventMetadata(
  bsdEventId: number,
): Promise<BsdMetadataData | null> {
  return bsdFetch<BsdMetadataData>(`/events/${bsdEventId}/metadata/`);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el marcador FINAL de BSD, sumando goles de tiempo extra
 * (AET) cuando existan. No suma penales, ya que esos definen el ganador
 * pero no el marcador del partido para la quiniela.
 * Retorna null si aún no hay marcador base.
 */
export function getBsdFinalScore(
  event: Pick<
    BsdLiveEvent,
    "home_score" | "away_score" | "extra_time_score"
  >,
): { home: number; away: number } | null {
  if (
    event.home_score === null ||
    event.away_score === null ||
    event.home_score === undefined ||
    event.away_score === undefined
  ) {
    return null;
  }
  const extra = event.extra_time_score ?? { home: 0, away: 0 };
  return {
    home: event.home_score + extra.home,
    away: event.away_score + extra.away,
  };
}

/**
 * Convierte el status BSD a MatchStatus de Prisma.
 * Siempre retorna un valor válido — fallback a "SCHEDULED".
 */
export function bsdStatusToLocal(
  bsdStatus: BsdMatchStatus,
): "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" {
  switch (bsdStatus) {
    case "inprogress":
    case "1st_half":
    case "2nd_half":
    case "halftime":
    case "extra_time":
    case "penalties":
      return "LIVE";
    case "finished":
      return "FINISHED";
    case "postponed":
      return "POSTPONED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "SCHEDULED";
  }
}
