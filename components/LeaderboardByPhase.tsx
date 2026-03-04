"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  GitCompare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { translateCountry } from "@/lib/translations";

interface MatchInfo {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  group?: string;
  phase?: string;
}

interface Prediction {
  matchId: string;
  phase: string | null;
  points: number;
  homeScore: number;
  awayScore: number;
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
}

/** The 3 torneos + "All" */
const TORNEOS = [
  { value: "ALL", label: "Todo" },
  { value: "T1", label: "1. Grupos" },
  { value: "T2", label: "2. 32avos" },
  { value: "T3", label: "3. Finales" },
];

/** Which raw phases belong to each torneo */
const TORNEO_PHASES: Record<string, string[]> = {
  T1: ["GROUP_STAGE"],
  T2: ["ROUND_OF_32"],
  T3: ["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"],
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
  ROUND_OF_32: "32avos de Final",
  ROUND_OF_16: "16avos (Octavos)",
  QUARTER_FINAL: "Cuartos de Final",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3er Lugar",
  FINAL: "Final",
};

const TORNEO_LABELS: Record<string, string> = {
  T1: "Torneo 1 · Grupos",
  T2: "Torneo 2 · 32avos",
  T3: "Torneo 3 · Finales",
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

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardByPhase({
  users,
  matchMap,
  currentUserId,
  finishedMatchIds,
}: LeaderboardByPhaseProps) {
  const [selectedTorneo, setSelectedTorneo] = useState("ALL");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const finishedSet = useMemo(
    () => new Set(finishedMatchIds),
    [finishedMatchIds],
  );

  const leaderboard = useMemo(() => {
    const tierCheck = TORNEO_TIER[selectedTorneo] ?? (() => true);
    const phasesForTorneo = TORNEO_PHASES[selectedTorneo] ?? [];
    return users
      .filter(tierCheck)
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
  }, [users, selectedTorneo, finishedSet]);

  const myEntry = leaderboard.find((u) => u.id === currentUserId);
  const myRank = leaderboard.findIndex((u) => u.id === currentUserId) + 1;

  return (
    <div className="space-y-3">
      {/* Torneo filter */}
      <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {TORNEOS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setSelectedTorneo(t.value);
              setExpandedUser(null);
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
          const isExpanded = expandedUser === user.id;
          const isMe = user.id === currentUserId;

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
                onClick={() => setExpandedUser(isExpanded ? null : user.id)}
              >
                {/* Position */}
                <span className="w-7 text-center text-sm font-bold flex-shrink-0">
                  {idx < 3 ? (
                    MEDAL[idx]
                  ) : (
                    <span className="text-muted-foreground">#{idx + 1}</span>
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
                    <span className="text-sm font-semibold truncate">
                      {user.name}
                    </span>
                    {isMe && (
                      <Badge
                        variant="default"
                        className="text-[9px] h-4 px-1.5 py-0"
                      >
                        Tú
                      </Badge>
                    )}
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
                                  const na = parseInt(
                                    a.matchId.replace("match_", ""),
                                    10,
                                  );
                                  const nb = parseInt(
                                    b.matchId.replace("match_", ""),
                                    10,
                                  );
                                  return na - nb;
                                })
                                .map((pred) => {
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
                                        pred.points === 5 &&
                                          "border-green-500/30 bg-green-500/5",
                                        pred.points === 3 &&
                                          "border-blue-500/30 bg-blue-500/5",
                                        isFinished &&
                                          pred.points === 0 &&
                                          "border-red-300/30 bg-red-500/5",
                                        isPending &&
                                          "border-border bg-background opacity-70",
                                      )}
                                    >
                                      {/* Result icon */}
                                      {pred.points === 5 ? (
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
                                        {match ? (
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
                                          pred.points === 5 && "text-green-600",
                                          pred.points === 3 && "text-blue-600",
                                          isFinished &&
                                            pred.points === 0 &&
                                            "text-red-400",
                                          isPending && "text-muted-foreground",
                                        )}
                                      >
                                        {pred.points > 0
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
    </div>
  );
}
