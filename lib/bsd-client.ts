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
  | "penalties"
  | "finished"
  | "postponed"
  | "cancelled";

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

/**
 * Convierte el status BSD a MatchStatus de Prisma.
 * Siempre retorna un valor válido — fallback a "SCHEDULED".
 */
export function bsdStatusToLocal(
  bsdStatus: BsdMatchStatus,
): "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" {
  switch (bsdStatus) {
    case "inprogress":
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
