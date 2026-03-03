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
  predictions: Prediction[];
}

interface LeaderboardByPhaseProps {
  users: UserWithPoints[];
  matchMap: Record<string, MatchInfo>;
  currentUserId: string;
}

const PHASES = [
  { value: "ALL", label: "Todo" },
  { value: "GROUP_STAGE", label: "Grupos" },
  { value: "ROUND_OF_32", label: "32avos" },
  { value: "ROUND_OF_16", label: "16avos" },
  { value: "QUARTER_FINAL", label: "Cuartos" },
  { value: "SEMI_FINAL", label: "Semis" },
  { value: "FINAL", label: "Final" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardByPhase({
  users,
  matchMap,
  currentUserId,
}: LeaderboardByPhaseProps) {
  const [selectedPhase, setSelectedPhase] = useState("ALL");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const leaderboard = useMemo(() => {
    return users
      .map((user) => {
        const preds =
          selectedPhase === "ALL"
            ? user.predictions
            : user.predictions.filter((p) => p.phase === selectedPhase);
        const points = preds.reduce((s, p) => s + p.points, 0);
        const exact = preds.filter((p) => p.points === 5).length;
        const correct = preds.filter((p) => p.points === 3).length;
        const wrong = preds.filter((p) => p.points === 0).length;
        return { ...user, points, preds, exact, correct, wrong };
      })
      .sort((a, b) => b.points - a.points);
  }, [users, selectedPhase]);

  const myEntry = leaderboard.find((u) => u.id === currentUserId);
  const myRank = leaderboard.findIndex((u) => u.id === currentUserId) + 1;

  return (
    <div className="space-y-3">
      {/* Phase filter — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {PHASES.map((ph) => (
          <button
            key={ph.value}
            onClick={() => setSelectedPhase(ph.value)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
              selectedPhase === ph.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {ph.label}
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
                isMe && "border-primary/60 bg-primary/5"
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
                    <span className="text-sm font-semibold truncate">{user.name}</span>
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
                      <p className="text-lg font-black text-primary">{user.points}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-green-600">{user.exact}</p>
                      <p className="text-[10px] text-muted-foreground">exactos</p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-blue-600">{user.correct}</p>
                      <p className="text-[10px] text-muted-foreground">ganador</p>
                    </div>
                    <div className="bg-background rounded-lg py-2">
                      <p className="text-lg font-black text-red-500">{user.wrong}</p>
                      <p className="text-[10px] text-muted-foreground">fallos</p>
                    </div>
                  </div>

                  {/* Predictions list */}
                  {user.preds.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Predicciones
                      </p>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {user.preds
                          .sort((a, b) => b.points - a.points)
                          .map((pred) => {
                            const numId = pred.matchId.replace("match_", "");
                            const match = matchMap[numId];
                            return (
                              <div
                                key={pred.matchId}
                                className={cn(
                                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border",
                                  pred.points === 5 && "border-green-500/30 bg-green-500/5",
                                  pred.points === 3 && "border-blue-500/30 bg-blue-500/5",
                                  pred.points === 0 && "border-border bg-background"
                                )}
                              >
                                {/* Result icon */}
                                {pred.points === 5 ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                ) : pred.points === 3 ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
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
                                    pred.points === 0 && "text-muted-foreground"
                                  )}
                                >
                                  {pred.points > 0 ? `+${pred.points}` : "0"}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sin predicciones en esta fase
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
