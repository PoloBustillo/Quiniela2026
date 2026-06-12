"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  GitCompare,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { translateCountry } from "@/lib/translations";
import LeaderboardRaceChart from "@/components/LeaderboardRaceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatchInfo {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  group?: string;
  phase?: string;
  order?: number;
}

interface Prediction {
  matchId: string;
  phase: string | null;
  points: number;
  homeScore: number | null;
  awayScore: number | null;
}

interface UserWithPoints {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  isCurrentUser: boolean;
  hasPaid: boolean;
  paidGroupStage: boolean;
  paidKnockout: boolean;
  paidFinals: boolean;
  predictions: Prediction[];
}

interface LeaderboardByPhaseProps {
  users: UserWithPoints[];
  matchMap: Record<string, MatchInfo>;
  currentUserId: string;
  finishedMatchIds: string[];
  finishedMatchDayMap?: Record<string, string>;
  paidCounts: { T1: number; T2: number; T3: number };
}

/** The 3 torneos + "All" */
const TORNEOS = [
  { value: "ALL", label: "Todo" },
  { value: "T1", label: "1. Grupos" },
  { value: "T2", label: "2. 16vos + 8vos" },
  { value: "T3", label: "3. Fases finales" },
];

/** Which raw phases belong to each torneo */
const TORNEO_PHASES: Record<string, string[]> = {
  T1: ["GROUP_STAGE"],
  T2: ["ROUND_OF_32", "ROUND_OF_16"],
  T3: ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"],
};

/** Which payment flag a user needs to appear in a given torneo tab */
const TORNEO_TIER: Record<string, (u: UserWithPoints) => boolean> = {
  ALL: () => true,
  T1: (u) => u.hasPaid || u.paidGroupStage,
  T2: (u) => u.hasPaid || u.paidKnockout,
  T3: (u) => u.hasPaid || u.paidFinals,
};

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_OF_32: "16vos de Final",
  ROUND_OF_16: "8vos de Final",
  QUARTER_FINAL: "Cuartos de Final",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3er Lugar",
  FINAL: "Final",
};

const TORNEO_LABELS: Record<string, string> = {
  T1: "Torneo 1 · Grupos",
  T2: "Torneo 2 · 16vos + 8vos",
  T3: "Torneo 3 · Fases finales",
};

const PHASE_ORDER = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

const isUserPaid = (u: UserWithPoints) =>
  u.hasPaid || u.paidGroupStage || u.paidKnockout || u.paidFinals;

const MEDAL = ["🥇", "🥈", "🥉"];
const WORLD_CUP_START_DAY = "2026-06-11";

/** Competition ranking: empatados comparten la misma posición, la siguiente es P+N */
const getCompetitionRank = (
  sorted: { id: string; points: number }[],
): Map<string, number> => {
  const ranks = new Map<string, number>();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j < sorted.length &&
      sorted[j].points === sorted[i].points
    ) {
      j++;
    }
    const rank = i + 1;
    for (let k = i; k < j; k++) {
      ranks.set(sorted[k].id, rank);
    }
    i = j;
  }
  return ranks;
};

const getMexicoSystemDay = (date: Date) =>
  date.toLocaleDateString("sv-SE", {
    timeZone: "America/Mexico_City",
  });

const formatMexicoSystemDateTime = (date: Date) =>
  date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });

const getPredictionOrder = (
  matchId: string,
  matchMap: Record<string, MatchInfo>,
) => {
  const rawId = matchId.replace("match_", "");
  const orderFromMap = matchMap[rawId]?.order;
  if (typeof orderFromMap === "number") {
    return orderFromMap;
  }

  const numeric = Number(rawId);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return Number.MAX_SAFE_INTEGER;
};

const getQuotaLabel = (selectedTorneo: string, user: UserWithPoints) => {
  if (selectedTorneo === "T1") {
    return TORNEO_TIER.T1(user) ? "Cuota cubierta" : "Cuota pendiente";
  }
  if (selectedTorneo === "T2") {
    return TORNEO_TIER.T2(user) ? "Cuota cubierta" : "Cuota pendiente";
  }
  if (selectedTorneo === "T3") {
    return TORNEO_TIER.T3(user) ? "Cuota cubierta" : "Cuota pendiente";
  }

  const covered = [
    user.hasPaid || user.paidGroupStage,
    user.hasPaid || user.paidKnockout,
    user.hasPaid || user.paidFinals,
  ].filter(Boolean).length;

  if (covered === 3) return "3/3 cuotas";
  if (covered > 0) return `${covered}/3 cuotas`;
  return "0/3 cuotas";
};

const PRIZE_PER_ENTRY = 100;

/** Premio base por posición (sin empate) */
const basePrize = (bote: number, position: number): number => {
  if (position === 1) return Math.round(bote * 0.70 - 50);
  if (position === 2) return Math.round(bote * 0.30 - 50);
  if (position === 3) return 100;
  return 0;
};

/**
 * Calcula el premio considerando empates.
 * Si N usuarios empatan en posición P, combinan los premios de P, P+1, ..., P+N-1
 */
const calculatePrize = (
  paidCount: number,
  rank: number,
  tiedCount: number,
): number | null => {
  const bote = paidCount * PRIZE_PER_ENTRY;
  let total = 0;
  for (let i = 0; i < tiedCount; i++) {
    total += basePrize(bote, rank + i);
  }
  const prize = Math.round(total / tiedCount);
  return prize > 0 ? prize : null;
};

export default function LeaderboardByPhase({
  users,
  matchMap,
  currentUserId,
  finishedMatchIds,
  finishedMatchDayMap = {},
  paidCounts,
}: LeaderboardByPhaseProps) {
  const [selectedTorneo, setSelectedTorneo] = useState("ALL");
  const [viewTab, setViewTab] = useState<"tabla" | "grafica">("tabla");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showUnpaidUsers, setShowUnpaidUsers] = useState(false);
  const [systemNow, setSystemNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setSystemNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const currentSystemDay = useMemo(
    () => getMexicoSystemDay(systemNow),
    [systemNow],
  );
  const systemDateLabel = useMemo(
    () => formatMexicoSystemDateTime(systemNow),
    [systemNow],
  );

  const finishedSet = useMemo(
    () => new Set(finishedMatchIds),
    [finishedMatchIds],
  );

  const leaderboard = useMemo(() => {
    const phasesForTorneo = TORNEO_PHASES[selectedTorneo] ?? [];
    const visibleUsers = showUnpaidUsers
      ? users
      : users.filter(isUserPaid);
    const sorted = visibleUsers
      .map((user) => {
        const preds =
          selectedTorneo === "ALL"
            ? user.predictions
            : user.predictions.filter(
                (p) => p.phase && phasesForTorneo.includes(p.phase),
              );
        const points = preds.reduce((s, p) => s + p.points, 0);
        const exact = preds.filter((p) => p.points === 5).length;
        const correct = preds.filter((p) => p.points === 3).length;
        // Only count wrong predictions for *completed* matches
        const wrong = preds.filter(
          (p) => p.points === 0 && finishedSet.has(p.matchId),
        ).length;
        const pending = preds.filter(
          (p) => p.points === 0 && !finishedSet.has(p.matchId),
        ).length;
        return { ...user, points, preds, exact, correct, wrong, pending };
      })
      .sort((a, b) => b.points - a.points);

    const rankMap = getCompetitionRank(sorted);
    return sorted.map((u) => ({ ...u, rank: rankMap.get(u.id) ?? 0 }));
  }, [users, selectedTorneo, finishedSet, showUnpaidUsers]);

  const myEntry = leaderboard.find((u) => u.id === currentUserId);
  const myRank = myEntry?.rank ?? 0;
  const raceFrames = useMemo(() => {
    const phasesForTorneo = TORNEO_PHASES[selectedTorneo] ?? [];
    const visibleUsers = showUnpaidUsers
      ? users
      : users.filter(isUserPaid);
    const dayKeys = Array.from(new Set(Object.values(finishedMatchDayMap)))
      .filter((day) => day >= WORLD_CUP_START_DAY && day <= currentSystemDay)
      .sort();

    if (dayKeys.length === 0) {
      return [
        {
          label: "Torneo por iniciar",
          rows: leaderboard.map((u) => ({
            id: u.id,
            name: u.name,
            image: u.image,
            value: u.points,
          })),
        },
      ];
    }

    // Build day buckets with backend points for finished matches.
    const dayBuckets: Record<string, Record<string, number>> = {};
    for (const day of dayKeys) dayBuckets[day] = {};

    for (const user of visibleUsers) {
      for (const pred of user.predictions) {
        if (!finishedSet.has(pred.matchId)) continue;
        const matchDay = finishedMatchDayMap[pred.matchId];
        if (!matchDay || !dayBuckets[matchDay]) continue;
        if (
          selectedTorneo !== "ALL" &&
          (!pred.phase || !phasesForTorneo.includes(pred.phase))
        ) {
          continue;
        }
        dayBuckets[matchDay][user.id] =
          (dayBuckets[matchDay][user.id] || 0) + pred.points;
      }
    }

    // Incremental cumulative frames: every user appears every jornada.
    const runningTotals = new Map<string, number>();
    visibleUsers.forEach((u) => runningTotals.set(u.id, 0));

    const frames = dayKeys.map((day) => {
      const bucket = dayBuckets[day];
      for (const user of visibleUsers) {
        const add = bucket[user.id] || 0;
        runningTotals.set(user.id, (runningTotals.get(user.id) || 0) + add);
      }

      const rows = visibleUsers
        .map((user) => ({
          id: user.id,
          name: user.name,
          image: user.image,
          value: runningTotals.get(user.id) || 0,
        }))
        .sort((a, b) => b.value - a.value);

      return { label: day, rows };
    });

    // Parity check: last frame totals must equal backend sums under same filter.
    const expectedTotals = new Map<string, number>();
    visibleUsers.forEach((u) => {
      const total = u.predictions.reduce((acc, p) => {
        if (!finishedSet.has(p.matchId)) return acc;
        const hasDay = !!finishedMatchDayMap[p.matchId];
        if (!hasDay) return acc;
        if (
          selectedTorneo !== "ALL" &&
          (!p.phase || !phasesForTorneo.includes(p.phase))
        ) {
          return acc;
        }
        return acc + p.points;
      }, 0);
      expectedTotals.set(u.id, total);
    });

    const last = frames[frames.length - 1];
    const mismatch = last.rows.find(
      (r) => (expectedTotals.get(r.id) || 0) !== r.value,
    );
    if (mismatch) {
      console.warn("Race parity mismatch detected", {
        selectedTorneo,
        userId: mismatch.id,
        expected: expectedTotals.get(mismatch.id) || 0,
        actual: mismatch.value,
      });
    }

    return frames;
  }, [users, leaderboard, selectedTorneo, finishedSet, finishedMatchDayMap, currentSystemDay, showUnpaidUsers]);

  /** Drop last surname when 4+ words; hard-cap at 28 chars. */
  const formatDisplayName = (n: string) => {
    const words = n.trim().split(/\s+/);
    const shortened = words.length >= 4 ? words.slice(0, 3).join(" ") : n;
    return shortened.length > 28 ? shortened.slice(0, 27) + "…" : shortened;
  };

  return (
    <div className="space-y-3">
      <Tabs
        value={viewTab}
        onValueChange={(v) => setViewTab(v as "tabla" | "grafica")}
        className="space-y-3"
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          {/* UI-REC #1: typo fix — revert to "Grafica" (no accent) if preferred */}
          <TabsTrigger value="grafica">Gráfica</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="space-y-3">
      {/* Torneo filter */}
      <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {TORNEOS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setSelectedTorneo(t.value);
              setExpandedUsers(new Set());
            }}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              selectedTorneo === t.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Show/hide unpaid users toggle */}
      <button
        onClick={() => setShowUnpaidUsers((v) => !v)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
          showUnpaidUsers
            ? "bg-amber-50 text-amber-700 border-amber-300/60"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {showUnpaidUsers ? "Ocultar sin pagar" : "Mostrar sin pagar"}
      </button>

      {/* Compare CTA */}
      <Link
        href="/leaderboard/compare"
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-primary/40 hover:bg-primary/5 transition-colors text-sm text-primary font-medium"
      >
        <GitCompare className="h-4 w-4 flex-shrink-0" />
        Comparar predicciones con otro participante →
      </Link>

      {/* My summary card (if not top 3) */}
      {myEntry && myRank > 3 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="px-3 py-2.5 flex items-center gap-3">
            <span className="text-2xl font-black text-primary w-8 text-center">
              #{myRank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{myEntry.name}</p>
              <p className="text-xs text-muted-foreground">
                {myEntry.exact}✓✓ · {myEntry.correct}✓ · {myEntry.wrong}✗
                {myEntry.pending > 0 ? ` · ${myEntry.pending}⏳` : ""}
              </p>
            </div>
            <span className="text-xl font-black text-primary">
              {myEntry.points}pts
            </span>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard rows */}
      <div className="space-y-1.5">
        {leaderboard.map((user, idx) => {
          const isExpanded = expandedUsers.has(user.id);
          const isMe = user.id === currentUserId;
          const paidForCurrentTorneo =
            selectedTorneo === "ALL"
              ? user.hasPaid ||
                user.paidGroupStage ||
                user.paidKnockout ||
                user.paidFinals
              : (TORNEO_TIER[selectedTorneo] ?? (() => true))(user);
          const quotaLabel = getQuotaLabel(selectedTorneo, user);

          const tiedCount = leaderboard.filter((u) => u.rank === user.rank).length;
          const prizeAmount =
            user.rank <= 3 && selectedTorneo !== "ALL"
              ? calculatePrize(paidCounts[selectedTorneo as keyof typeof paidCounts], user.rank, tiedCount)
              : null;

          return (
            <div
              key={user.id}
              className={cn(
                "rounded-xl border overflow-hidden transition-all",
                isMe && "border-primary/60 bg-primary/5",
              )}
            >
              {/* Row */}
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                onClick={() => {
                  setExpandedUsers((prev) => {
                    const next = new Set(prev);
                    if (next.has(user.id)) {
                      next.delete(user.id);
                    } else {
                      next.add(user.id);
                    }
                    return next;
                  });
                }}
              >
                {/* Position */}
                <span className="w-7 text-center text-sm font-bold flex-shrink-0">
                  {user.rank <= 3 ? (
                    MEDAL[user.rank - 1]
                  ) : (
                    <span className="text-muted-foreground">#{user.rank}</span>
                  )}
                </span>

                {/* Avatar */}
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name[0]}
                  </div>
                )}

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm font-semibold"
                      style={
                        {
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as unknown as React.CSSProperties
                      }
                      title={user.name}
                    >
                      {formatDisplayName(user.name)}
                    </span>
                    {isMe && (
                      <Badge
                        variant="default"
                        className="text-[9px] h-4 px-1.5 py-0"
                      >
                        Tú
                      </Badge>
                    )}
                    <Badge
                      variant={paidForCurrentTorneo ? "default" : "secondary"}
                      className={cn(
                        "text-[9px] h-4 px-1.5 py-0",
                        paidForCurrentTorneo
                          ? "bg-emerald-600/15 text-emerald-700"
                          : "bg-amber-100/60 text-amber-700 border border-amber-300/40",
                      )}
                    >
                      {quotaLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="text-green-600 font-medium">
                      {user.exact}✓✓
                    </span>
                    <span className="text-blue-600 font-medium">
                      {user.correct}✓
                    </span>
                    <span className="text-red-500">{user.wrong}✗</span>
                    {user.pending > 0 && (
                      <span className="text-muted-foreground">
                        {user.pending}⏳
                      </span>
                    )}
                    <span>{user.preds.length}p</span>
                  </div>
                </div>

                {/* Points + expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {prizeAmount != null && prizeAmount > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        user.rank === 1 && "bg-yellow-500/15 text-yellow-700",
                        user.rank === 2 && "bg-slate-400/15 text-slate-600",
                        user.rank === 3 && "bg-amber-700/15 text-amber-800",
                      )}
                    >
                      ${prizeAmount}
                    </span>
                  )}
                  <span className="text-lg font-black text-primary">
                    {user.points}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t bg-muted/20 px-3 py-3 space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-primary">
                        {user.points}
                      </p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-green-600">
                        {user.exact}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        exactos
                      </p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-blue-600">
                        {user.correct}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ganador
                      </p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-red-500">
                        {user.wrong}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        fallos
                      </p>
                    </div>
                  </div>

                  {/* Predictions list — grouped by phase */}
                  {user.preds.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Predicciones
                      </p>
                      {(() => {
                        // Group predictions by phase, keep phase order
                        const grouped: Record<string, Prediction[]> = {};
                        for (const p of user.preds) {
                          const ph = p.phase ?? "GROUP_STAGE";
                          if (!grouped[ph]) grouped[ph] = [];
                          grouped[ph].push(p);
                        }
                        const phases = PHASE_ORDER.filter(
                          (ph) => grouped[ph]?.length,
                        );
                        return phases.map((ph) => (
                          <div key={ph} className="space-y-1">
                            {selectedTorneo === "ALL" && (
                              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest pt-1">
                                {PHASE_LABELS[ph] ?? ph}
                              </p>
                            )}
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {grouped[ph]
                                .sort((a, b) => {
                                  const na = getPredictionOrder(
                                    a.matchId,
                                    matchMap,
                                  );
                                  const nb = getPredictionOrder(
                                    b.matchId,
                                    matchMap,
                                  );

                                  if (na !== nb) {
                                    return na - nb;
                                  }

                                  return a.matchId.localeCompare(b.matchId);
                                })
                                .map((pred) => {
                                  const isRevealed =
                                    pred.homeScore !== null &&
                                    pred.awayScore !== null;
                                  const numId = pred.matchId.replace(
                                    "match_",
                                    "",
                                  );
                                  const match = matchMap[numId];
                                  const isFinished = finishedSet.has(
                                    pred.matchId,
                                  );
                                  const isPending =
                                    !isFinished && pred.points === 0;
                                  return (
                                    <div
                                      key={pred.matchId}
                                      className={cn(
                                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border",
                                        !isRevealed &&
                                          "border-amber-300/40 bg-amber-500/5",
                                        isRevealed &&
                                          pred.points === 5 &&
                                          "border-green-500/30 bg-green-500/5",
                                        isRevealed &&
                                          pred.points === 3 &&
                                          "border-blue-500/30 bg-blue-500/5",
                                        isRevealed &&
                                          isFinished &&
                                          pred.points === 0 &&
                                          "border-red-300/30 bg-red-500/5",
                                        isRevealed &&
                                          isPending &&
                                          "border-border bg-background opacity-70",
                                      )}
                                    >
                                      {/* Result icon */}
                                      {!isRevealed ? (
                                        <Lock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                      ) : pred.points === 5 ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                      ) : pred.points === 3 ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                      ) : isFinished ? (
                                        <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                                      ) : (
                                        <span className="h-3.5 w-3.5 flex-shrink-0 text-center text-[10px] leading-none">
                                          ⏳
                                        </span>
                                      )}

                                      {/* Teams */}
                                      <span className="flex-1 truncate text-muted-foreground">
                                        {!isRevealed ? (
                                          <span className="italic text-amber-700">
                                            Oculto hasta que inicie el partido
                                          </span>
                                        ) : match ? (
                                          <>
                                            {translateCountry(match.home)}{" "}
                                            <span className="text-foreground font-mono font-semibold">
                                              {pred.homeScore}–{pred.awayScore}
                                            </span>{" "}
                                            {translateCountry(match.away)}
                                          </>
                                        ) : (
                                          <span className="font-mono font-semibold">
                                            {pred.homeScore}–{pred.awayScore}
                                          </span>
                                        )}
                                      </span>

                                      {/* Points badge */}
                                      <span
                                        className={cn(
                                          "font-bold flex-shrink-0",
                                          !isRevealed && "text-amber-700",
                                          isRevealed &&
                                            pred.points === 5 &&
                                            "text-green-600",
                                          isRevealed &&
                                            pred.points === 3 &&
                                            "text-blue-600",
                                          isRevealed &&
                                            isFinished &&
                                            pred.points === 0 &&
                                            "text-red-400",
                                          isRevealed &&
                                            isPending &&
                                            "text-muted-foreground",
                                        )}
                                      >
                                        {!isRevealed
                                          ? "🔒"
                                          : pred.points > 0
                                            ? `+${pred.points}`
                                            : isPending
                                              ? "—"
                                              : "0"}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sin predicciones
                      {selectedTorneo !== "ALL"
                        ? ` en ${TORNEO_LABELS[selectedTorneo] ?? selectedTorneo}`
                        : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </TabsContent>

        <TabsContent value="grafica" className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
            {TORNEOS.map((t) => (
              <button
                key={`graph-${t.value}`}
                onClick={() => setSelectedTorneo(t.value)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                  selectedTorneo === t.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <LeaderboardRaceChart key={`race-${selectedTorneo}`} frames={raceFrames} />
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <p>Puntos acumulados por jornada (cada jornada = día con partidos).</p>
            <p style={{ display: "none" }}>Ciudad de Mexico {systemDateLabel}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
