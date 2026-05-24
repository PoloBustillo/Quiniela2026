"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Target,
  Users,
  BarChart2,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface LocalMatch {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCode: string;
  awayTeamCode: string;
  homeTeamFlag: string | null;
  awayTeamFlag: string | null;
  date: string;
  stadium: string;
  city: string;
  group: string;
  stage: string;
}

interface BsdTeamStats {
  ball_possession: number | null;
  total_shots: number | null;
  shots_on_target: number | null;
  corner_kicks: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  xg?: { actual: number | null } | null;
  pass_accuracy_pct?: number | null;
}

interface BsdIncident {
  type: string;
  minute: number;
  player?: string | null;
  player_id?: number | null;
  is_home?: boolean;
  card_type?: string | null;
  player_in?: string | null;
  player_out?: string | null;
  assist?: string | null;
  home_score?: number | null;
  away_score?: number | null;
}

interface BsdLineupPlayer {
  id: number;
  name: string;
  short_name: string;
  position: string;
  jersey_number: number | null;
  ai_score?: number | null;
}

interface BsdLineupsData {
  lineup_status: "confirmed" | "predicted" | "unavailable";
  beta: boolean;
  lineups: {
    home: {
      team_name: string;
      formation: string | null;
      confidence?: number | null;
      players: BsdLineupPlayer[];
      substitutes: BsdLineupPlayer[];
    };
    away: {
      team_name: string;
      formation: string | null;
      confidence?: number | null;
      players: BsdLineupPlayer[];
      substitutes: BsdLineupPlayer[];
    };
  } | null;
  unavailable_players: {
    home: Array<{ name: string; reason?: string }>;
    away: Array<{ name: string; reason?: string }>;
  } | null;
}

interface BsdPlayerStatItem {
  player_id: number;
  team_id: number;
  minutes_played: number;
  rating: number | null;
  goals: number;
  goal_assist: number;
  total_shots: number;
  shots_on_target: number;
  key_pass: number;
  yellow_card: number;
  red_card: number;
  saves: number | null;
  total_pass: number;
  accurate_pass: number;
}

interface BsdConsensusOdds {
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  over_25_goals: number | null;
  under_25_goals: number | null;
  btts_yes: number | null;
  btts_no: number | null;
}

interface BsdPredictionData {
  markets: {
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
  };
  recommendations: {
    bet_favorite: boolean;
    over_25: boolean;
    btts: boolean;
  };
  model: { confidence: number; version: string };
}

interface BsdMetadataData {
  funfacts: Array<{ type_id: number; sentence: string }>;
  ai_preview: { text: string; generated_at: string } | null;
}

interface MatchDetailTabsProps {
  localMatch: LocalMatch;
  currentScore: { home: number | null; away: number | null } | null;
  userPrediction: { homeScore: number; awayScore: number } | null;
  bsd: {
    status: string | null;
    period: string | null;
    currentMinute: number | null;
    homeScoreHt: number | null;
    awayScoreHt: number | null;
    stats: { stats: { home: BsdTeamStats; away: BsdTeamStats } | null } | null;
    incidents: BsdIncident[] | null;
    lineups: BsdLineupsData | null;
    playerStats: BsdPlayerStatItem[] | null;
    playerNameMap: Record<
      number,
      { name: string; position: string; team: "home" | "away" }
    >;
    odds: BsdConsensusOdds | null;
    prediction: BsdPredictionData | null;
    metadata: BsdMetadataData | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string | null) {
  if (!status || status === "notstarted")
    return <Badge variant="outline">Por jugar</Badge>;
  if (status === "inprogress" || status === "penalties")
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/40 gap-1">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </Badge>
    );
  if (status === "finished")
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        Final
      </Badge>
    );
  if (status === "postponed")
    return <Badge variant="destructive">Postponido</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function periodLabel(period: string | null) {
  const map: Record<string, string> = {
    "1st_half": "1T",
    halftime: "MT",
    "2nd_half": "2T",
    extra_time: "ET",
    FT: "FT",
  };
  return period ? (map[period] ?? period) : null;
}

function StatBar({
  label,
  home,
  away,
}: {
  label: string;
  home: number | null;
  away: number | null;
}) {
  const h = home ?? 0;
  const a = away ?? 0;
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;
  const awayPct = 100 - homePct;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-medium tabular-nums">{home ?? "–"}</span>
        <span className="text-center">{label}</span>
        <span className="font-medium tabular-nums">{away ?? "–"}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="bg-primary transition-all"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-secondary transition-all"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}

function ProbBar({
  label,
  pct,
  color = "bg-primary",
}: {
  label: string;
  pct: number;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function IncidentIcon({
  type,
  cardType,
}: {
  type: string;
  cardType?: string | null;
}) {
  if (type === "goal")
    return (
      <span className="text-base" title="Gol">
        ⚽
      </span>
    );
  if (type === "card") {
    if (cardType === "yellow")
      return (
        <span className="text-base" title="Amarilla">
          🟨
        </span>
      );
    if (cardType === "red" || cardType === "yellowRed")
      return (
        <span className="text-base" title="Roja">
          🟥
        </span>
      );
  }
  if (type === "substitution")
    return (
      <span className="text-base" title="Cambio">
        🔄
      </span>
    );
  if (type === "varDecision")
    return (
      <span className="text-base" title="VAR">
        📺
      </span>
    );
  return null;
}

function positionBadge(pos: string) {
  const colors: Record<string, string> = {
    G: "bg-yellow-500/20 text-yellow-400",
    D: "bg-blue-500/20 text-blue-400",
    M: "bg-green-500/20 text-green-400",
    F: "bg-red-500/20 text-red-400",
  };
  const c = colors[pos] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${c}`}>
      {pos}
    </span>
  );
}

function ratingColor(r: number | null) {
  if (!r) return "text-muted-foreground";
  if (r >= 8) return "text-green-400 font-bold";
  if (r >= 7) return "text-green-300";
  if (r >= 6) return "text-yellow-300";
  return "text-red-400";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MatchDetailTabs({
  localMatch: m,
  currentScore,
  userPrediction,
  bsd,
}: MatchDetailTabsProps) {
  const matchDate = new Date(m.date);
  const isLive = bsd.status === "inprogress" || bsd.status === "penalties";
  const isFinished = bsd.status === "finished";

  const homeScore = currentScore?.home;
  const awayScore = currentScore?.away;

  const hasStats =
    bsd.stats?.stats != null &&
    (bsd.stats.stats.home.total_shots != null ||
      bsd.stats.stats.home.ball_possession != null);
  const hasIncidents =
    bsd.incidents != null &&
    bsd.incidents.filter((i) => i.type !== "period").length > 0;

  // ── Header ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Match Card */}
      <Card>
        <CardContent className="pt-5 pb-4 px-4 sm:px-6">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {statusBadge(bsd.status)}
              {isLive && bsd.currentMinute && (
                <span className="text-green-400 font-mono text-xs">
                  {bsd.currentMinute}&apos;
                </span>
              )}
              {isLive && bsd.period && !bsd.currentMinute && (
                <span className="text-green-400 text-xs">
                  {periodLabel(bsd.period)}
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              Grupo {m.group}
            </Badge>
          </div>

          {/* Teams + Score */}
          <div className="flex items-center justify-between gap-3">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {m.homeTeamFlag ? (
                <Image
                  src={m.homeTeamFlag}
                  alt={m.homeTeamName}
                  width={56}
                  height={56}
                  className="rounded object-contain"
                />
              ) : (
                <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-2xl">
                  🏳️
                </div>
              )}
              <span className="text-sm font-semibold text-center leading-tight">
                {m.homeTeamName}
              </span>
            </div>

            {/* Score */}
            <div className="text-center shrink-0 px-2">
              {homeScore != null && awayScore != null ? (
                <>
                  <div className="text-4xl sm:text-5xl font-black tabular-nums">
                    {homeScore} – {awayScore}
                  </div>
                  {bsd.homeScoreHt != null && !isLive && (
                    <div className="text-xs text-muted-foreground mt-1">
                      MT: {bsd.homeScoreHt}–{bsd.awayScoreHt}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-muted-foreground">
                    VS
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {matchDate.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Mexico_City",
                    })}{" "}
                    CT
                  </div>
                </>
              )}
              {userPrediction && (
                <div className="text-xs text-primary mt-1.5 font-medium">
                  Tu pronóstico: {userPrediction.homeScore}–
                  {userPrediction.awayScore}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {m.awayTeamFlag ? (
                <Image
                  src={m.awayTeamFlag}
                  alt={m.awayTeamName}
                  width={56}
                  height={56}
                  className="rounded object-contain"
                />
              ) : (
                <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-2xl">
                  🏳️
                </div>
              )}
              <span className="text-sm font-semibold text-center leading-tight">
                {m.awayTeamName}
              </span>
            </div>
          </div>

          {/* Venue */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {m.stadium}, {m.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {matchDate.toLocaleDateString("es-MX", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "America/Mexico_City",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* AI Preview (show above tabs if available & match not started) */}
      {bsd.metadata?.ai_preview && !isFinished && !isLive && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4 px-4 sm:px-6">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                {bsd.metadata.ai_preview.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="resumen">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="resumen" className="text-xs sm:text-sm py-2">
            <BarChart2 className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Resumen</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="pred" className="text-xs sm:text-sm py-2">
            <Target className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Predicción</span>
            <span className="sm:hidden">Pred</span>
          </TabsTrigger>
          <TabsTrigger value="lineups" className="text-xs sm:text-sm py-2">
            <Users className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Alineación</span>
            <span className="sm:hidden">XI</span>
          </TabsTrigger>
          <TabsTrigger value="jugadores" className="text-xs sm:text-sm py-2">
            <Star className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Jugadores</span>
            <span className="sm:hidden">Jug</span>
          </TabsTrigger>
          <TabsTrigger value="datos" className="text-xs sm:text-sm py-2">
            <Lightbulb className="h-3 w-3 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Datos</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Resumen ─────────────────────────────────────────────────── */}
        <TabsContent value="resumen" className="mt-4 space-y-4">
          {hasStats && bsd.stats?.stats ? (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                <CardTitle className="text-base">
                  Estadísticas del partido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-6 pb-5">
                <StatBar
                  label="Posesión %"
                  home={bsd.stats.stats.home.ball_possession}
                  away={bsd.stats.stats.away.ball_possession}
                />
                <StatBar
                  label="Tiros totales"
                  home={bsd.stats.stats.home.total_shots}
                  away={bsd.stats.stats.away.total_shots}
                />
                <StatBar
                  label="Al arco"
                  home={bsd.stats.stats.home.shots_on_target}
                  away={bsd.stats.stats.away.shots_on_target}
                />
                {bsd.stats.stats.home.xg?.actual != null && (
                  <StatBar
                    label="xG (goles esperados)"
                    home={bsd.stats.stats.home.xg?.actual ?? null}
                    away={bsd.stats.stats.away.xg?.actual ?? null}
                  />
                )}
                <StatBar
                  label="Córners"
                  home={bsd.stats.stats.home.corner_kicks}
                  away={bsd.stats.stats.away.corner_kicks}
                />
                <StatBar
                  label="Faltas"
                  home={bsd.stats.stats.home.fouls}
                  away={bsd.stats.stats.away.fouls}
                />
                {bsd.stats.stats.home.pass_accuracy_pct != null && (
                  <StatBar
                    label="Precisión de pases %"
                    home={bsd.stats.stats.home.pass_accuracy_pct ?? null}
                    away={bsd.stats.stats.away.pass_accuracy_pct ?? null}
                  />
                )}
                {/* Legend */}
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 rounded-sm bg-primary" />
                    {m.homeTeamName}
                  </span>
                  <span className="flex items-center gap-1">
                    {m.awayTeamName}
                    <span className="inline-block h-2 w-3 rounded-sm bg-secondary" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">
                  {bsd.status === "notstarted" || !bsd.status
                    ? "Las estadísticas estarán disponibles cuando empiece el partido."
                    : "Estadísticas no disponibles."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Incidents Timeline */}
          {hasIncidents && bsd.incidents && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                <CardTitle className="text-base">Línea de tiempo</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-5">
                <div className="space-y-1.5">
                  {bsd.incidents
                    .filter(
                      (i) => i.type !== "period" && i.type !== "injuryTime",
                    )
                    .sort((a, b) => a.minute - b.minute)
                    .map((inc, idx) => {
                      const isHome = inc.is_home !== false;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 py-1 text-sm ${
                            isHome ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          {/* Icon */}
                          <div className="shrink-0">
                            <IncidentIcon
                              type={inc.type}
                              cardType={inc.card_type}
                            />
                          </div>
                          {/* Minute */}
                          <span className="text-xs font-mono text-muted-foreground w-8 text-center shrink-0">
                            {inc.minute}&apos;
                          </span>
                          {/* Player */}
                          <div
                            className={`flex-1 truncate text-xs ${
                              isHome ? "text-left" : "text-right"
                            }`}
                          >
                            {inc.type === "goal" && (
                              <span className="font-medium">
                                {inc.player ?? "Gol propio"}
                                {inc.assist && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (as. {inc.assist})
                                  </span>
                                )}
                                {inc.home_score != null && (
                                  <span className="ml-1 text-primary font-bold">
                                    {isHome
                                      ? `${inc.home_score}–${inc.away_score}`
                                      : `${inc.home_score}–${inc.away_score}`}
                                  </span>
                                )}
                              </span>
                            )}
                            {inc.type === "card" && (
                              <span>{inc.player ?? "Jugador"}</span>
                            )}
                            {inc.type === "substitution" && (
                              <span className="text-muted-foreground">
                                ↑{inc.player_in} ↓{inc.player_out}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Predicción ──────────────────────────────────────────────── */}
        <TabsContent value="pred" className="mt-4 space-y-4">
          {bsd.prediction ? (
            <>
              {/* Probabilities */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Predicción del modelo
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {bsd.prediction.model.version} ·{" "}
                      {(bsd.prediction.model.confidence * 100).toFixed(0)}%
                      confianza
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 sm:px-6 pb-5">
                  <ProbBar
                    label={`${m.homeTeamName} gana`}
                    pct={bsd.prediction.markets.match_result.prob_home}
                    color="bg-green-500"
                  />
                  <ProbBar
                    label="Empate"
                    pct={bsd.prediction.markets.match_result.prob_draw}
                    color="bg-yellow-500"
                  />
                  <ProbBar
                    label={`${m.awayTeamName} gana`}
                    pct={bsd.prediction.markets.match_result.prob_away}
                    color="bg-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        xG esperado
                      </p>
                      <p className="text-lg font-bold">
                        {bsd.prediction.markets.expected_goals.home.toFixed(1)}
                        <span className="text-muted-foreground mx-1">–</span>
                        {bsd.prediction.markets.expected_goals.away.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Marcador probable
                      </p>
                      <p className="text-lg font-bold">
                        {bsd.prediction.markets.score.most_likely}
                      </p>
                    </div>
                  </div>

                  {/* Over/Under + BTTS */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {bsd.prediction.markets.over_under.prob_over_25 != null && (
                      <div className="text-center rounded-lg border p-2">
                        <p className="text-xs text-muted-foreground">O2.5</p>
                        <p className="font-bold text-sm">
                          {bsd.prediction.markets.over_under.prob_over_25.toFixed(
                            0,
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {bsd.prediction.markets.btts?.prob_yes != null && (
                      <div className="text-center rounded-lg border p-2">
                        <p className="text-xs text-muted-foreground">
                          Ambos marcan
                        </p>
                        <p className="font-bold text-sm">
                          {bsd.prediction.markets.btts.prob_yes.toFixed(0)}%
                        </p>
                      </div>
                    )}
                    <div
                      className={`text-center rounded-lg border p-2 ${
                        bsd.prediction.recommendations.bet_favorite
                          ? "border-green-500/40 bg-green-500/10"
                          : ""
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Favorito</p>
                      <p className="font-bold text-sm">
                        {bsd.prediction.markets.match_result.predicted === "H"
                          ? m.homeTeamCode.toUpperCase()
                          : bsd.prediction.markets.match_result.predicted ===
                              "A"
                            ? m.awayTeamCode.toUpperCase()
                            : "Emp."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Odds */}
              {bsd.odds && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                    <CardTitle className="text-base">
                      Cuotas (consenso)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-5">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {m.homeTeamName}
                        </p>
                        <p className="text-xl font-bold">
                          {bsd.odds.home_win?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Empate
                        </p>
                        <p className="text-xl font-bold">
                          {bsd.odds.draw?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {m.awayTeamName}
                        </p>
                        <p className="text-xl font-bold">
                          {bsd.odds.away_win?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-center text-sm">
                      <div className="rounded border p-2">
                        <span className="text-xs text-muted-foreground">
                          O2.5 / U2.5
                        </span>
                        <p className="font-medium">
                          {bsd.odds.over_25_goals?.toFixed(2) ?? "–"} /{" "}
                          {bsd.odds.under_25_goals?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                      <div className="rounded border p-2">
                        <span className="text-xs text-muted-foreground">
                          BTTS Sí / No
                        </span>
                        <p className="font-medium">
                          {bsd.odds.btts_yes?.toFixed(2) ?? "–"} /{" "}
                          {bsd.odds.btts_no?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Target className="h-8 w-8 opacity-40" />
                <p className="text-sm text-center">
                  La predicción del modelo estará disponible próximamente.
                </p>
                {bsd.odds && (
                  <div className="w-full max-w-sm mt-4">
                    <p className="text-xs text-center mb-3 font-medium">
                      Cuotas disponibles
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">
                          {m.homeTeamName}
                        </p>
                        <p className="font-bold">
                          {bsd.odds.home_win?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">X</p>
                        <p className="font-bold">
                          {bsd.odds.draw?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">
                          {m.awayTeamName}
                        </p>
                        <p className="font-bold">
                          {bsd.odds.away_win?.toFixed(2) ?? "–"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Alineaciones ────────────────────────────────────────────── */}
        <TabsContent value="lineups" className="mt-4 space-y-4">
          {bsd.lineups &&
          bsd.lineups.lineup_status !== "unavailable" &&
          bsd.lineups.lineups ? (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                {bsd.lineups.lineup_status === "predicted" ? (
                  <>
                    <Badge variant="outline" className="text-xs">
                      IA predicho
                    </Badge>
                    {bsd.lineups.lineups.home.confidence != null && (
                      <span>
                        Confianza:{" "}
                        {(bsd.lineups.lineups.home.confidence * 100).toFixed(0)}
                        %
                      </span>
                    )}
                  </>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-500/10 text-green-400 border-green-500/30"
                  >
                    XI confirmado
                  </Badge>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(["home", "away"] as const).map((side) => {
                  const team = bsd.lineups!.lineups![side];
                  const unavail =
                    bsd.lineups!.unavailable_players?.[side] ?? [];
                  return (
                    <Card key={side}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{team.team_name}</span>
                          {team.formation && (
                            <Badge variant="secondary" className="text-xs">
                              {team.formation}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-1">
                        {team.players.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 py-0.5 text-sm"
                          >
                            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                              {p.jersey_number ?? "–"}
                            </span>
                            {positionBadge(p.position)}
                            <span className="truncate flex-1">
                              {p.short_name}
                            </span>
                            {p.ai_score != null && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {(p.ai_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        ))}
                        {team.substitutes.length > 0 && (
                          <>
                            <div className="border-t my-2 pt-2">
                              <p className="text-xs text-muted-foreground mb-1.5">
                                Suplentes
                              </p>
                              {team.substitutes.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-2 py-0.5 text-sm opacity-70"
                                >
                                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                                    {p.jersey_number ?? "–"}
                                  </span>
                                  {positionBadge(p.position)}
                                  <span className="truncate flex-1">
                                    {p.short_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {unavail.length > 0 && (
                          <div className="border-t mt-2 pt-2">
                            <p className="text-xs text-destructive mb-1.5">
                              No disponibles
                            </p>
                            {unavail.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs text-muted-foreground py-0.5"
                              >
                                <span>🚑</span>
                                <span>{p.name}</span>
                                {p.reason && (
                                  <span className="text-xs italic truncate">
                                    {p.reason}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm text-center">
                  {!bsd.lineups
                    ? "Alineaciones no disponibles en este momento."
                    : "Las alineaciones se publicarán ~1 hora antes del partido."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Jugadores ───────────────────────────────────────────────── */}
        <TabsContent value="jugadores" className="mt-4">
          {bsd.playerStats && bsd.playerStats.length > 0 ? (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                <CardTitle className="text-base">Calificaciones</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-4 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pl-4 sm:pl-6 py-2 text-left font-medium w-6">
                        Cal.
                      </th>
                      <th className="px-2 py-2 text-left font-medium">
                        Jugador
                      </th>
                      <th className="px-2 py-2 text-center font-medium">Min</th>
                      <th className="px-2 py-2 text-center font-medium">G</th>
                      <th className="px-2 py-2 text-center font-medium">A</th>
                      <th className="px-2 py-2 text-center font-medium">
                        Tiros
                      </th>
                      <th className="px-2 py-2 text-center font-medium">
                        Pases
                      </th>
                      <th className="pr-4 sm:pr-6 py-2 text-center font-medium">
                        Tar.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bsd.playerStats
                      .slice()
                      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
                      .map((p, idx) => {
                        const info = bsd.playerNameMap[p.player_id];
                        const isHome = info?.team === "home";
                        const passAcc =
                          p.total_pass > 0
                            ? `${Math.round((p.accurate_pass / p.total_pass) * 100)}%`
                            : "–";
                        return (
                          <tr
                            key={idx}
                            className={`border-b border-muted/50 hover:bg-muted/30 transition-colors ${
                              isHome ? "" : "bg-muted/10"
                            }`}
                          >
                            <td className="pl-4 sm:pl-6 py-1.5">
                              <span
                                className={`font-bold text-sm ${ratingColor(p.rating)}`}
                              >
                                {p.rating?.toFixed(1) ?? "–"}
                              </span>
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1.5">
                                {info ? positionBadge(info.position) : null}
                                <span className="truncate max-w-[100px] sm:max-w-none">
                                  {info?.name ?? `#${p.player_id}`}
                                </span>
                                {isHome ? (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {m.homeTeamCode.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {m.awayTeamCode.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">
                              {p.minutes_played}
                            </td>
                            <td className="px-2 py-1.5 text-center font-medium">
                              {p.goals > 0 ? (
                                <span className="text-green-400">
                                  {p.goals}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {p.goal_assist > 0 ? (
                                <span className="text-blue-400">
                                  {p.goal_assist}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">
                              {p.total_shots}
                              {p.shots_on_target > 0 && (
                                <span className="text-primary">
                                  {" "}
                                  ({p.shots_on_target})
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">
                              {passAcc}
                            </td>
                            <td className="pr-4 sm:pr-6 py-1.5 text-center">
                              {p.yellow_card > 0 && <span>🟨</span>}
                              {p.red_card > 0 && <span>🟥</span>}
                              {p.saves != null && p.saves > 0 && (
                                <span className="text-yellow-400 text-xs">
                                  {p.saves}sv
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground px-4 sm:px-6 mt-2">
                  Tiros: total (al arco) · G=goles · A=asistencias ·
                  Tar=tarjetas
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Star className="h-8 w-8 opacity-40" />
                <p className="text-sm text-center">
                  Las calificaciones están disponibles al terminar el partido.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Datos / Fun Facts ───────────────────────────────────────── */}
        <TabsContent value="datos" className="mt-4 space-y-4">
          {/* Fun Facts */}
          {bsd.metadata?.funfacts && bsd.metadata.funfacts.length > 0 ? (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  Datos previos al partido
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-5 space-y-2">
                {bsd.metadata.funfacts.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 border-b border-muted/40 last:border-0"
                  >
                    <span className="text-yellow-400 mt-0.5 shrink-0">→</span>
                    <p className="text-sm leading-relaxed">{f.sentence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* AI Preview */}
          {bsd.metadata?.ai_preview && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Vista previa IA
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-5">
                <p className="text-sm leading-relaxed">
                  {bsd.metadata.ai_preview.text}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Generado:{" "}
                  {new Date(
                    bsd.metadata.ai_preview.generated_at,
                  ).toLocaleString("es-MX", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Mexico_City",
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Basic match info */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
              <CardTitle className="text-base">
                Información del partido
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fase</span>
                <span>{m.stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grupo</span>
                <span>{m.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estadio</span>
                <span>{m.stadium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciudad</span>
                <span>{m.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span>
                  {new Date(m.date).toLocaleString("es-MX", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Mexico_City",
                  })}{" "}
                  CT
                </span>
              </div>
              {bsd.prediction && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BSD Event ID</span>
                  <span className="font-mono text-xs">
                    {bsd.prediction.model.version}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {!bsd.metadata && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Lightbulb className="h-8 w-8 opacity-40" />
                <p className="text-sm text-center">
                  Los datos curiosos estarán disponibles antes del partido.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
