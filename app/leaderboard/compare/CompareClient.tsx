"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Minus, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { translateCountry } from "@/lib/translations";

interface Prediction {
  matchId: string;
  phase: string | null;
  points: number;
  homeScore: number;
  awayScore: number;
}

interface UserData {
  id: string;
  name: string;
  image: string | null;
  isCurrentUser: boolean;
  predictions: Prediction[];
}

interface MatchInfo {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  group?: string;
}

interface CompareClientProps {
  users: UserData[];
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

type Filter = "all" | "same" | "different";

export default function CompareClient({ users, matchMap, currentUserId }: CompareClientProps) {
  const [compareUserId, setCompareUserId] = useState<string>("");
  const [phase, setPhase] = useState("ALL");
  const [filter, setFilter] = useState<Filter>("all");

  const me = users.find((u) => u.id === currentUserId);
  const other = users.find((u) => u.id === compareUserId);

  const comparison = useMemo(() => {
    if (!me || !other) return null;

    // All matchIds from either user
    const myIds = new Set(me.predictions.map((p) => p.matchId));
    const otherIds = new Set(other.predictions.map((p) => p.matchId));
    const allIds = new Set([...myIds, ...otherIds]);

    const rows = Array.from(allIds)
      .map((matchId) => {
        const myPred = me.predictions.find((p) => p.matchId === matchId);
        const otherPred = other.predictions.find((p) => p.matchId === matchId);
        const match = matchMap[matchId.replace("match_", "")];
        const same =
          myPred && otherPred &&
          myPred.homeScore === otherPred.homeScore &&
          myPred.awayScore === otherPred.awayScore;

        // Filter by phase
        const predPhase = myPred?.phase || otherPred?.phase;
        if (phase !== "ALL" && predPhase !== phase) return null;

        return { matchId, myPred, otherPred, match, same };
      })
      .filter(Boolean) as {
        matchId: string;
        myPred: Prediction | undefined;
        otherPred: Prediction | undefined;
        match: MatchInfo | undefined;
        same: boolean;
      }[];

    const filtered =
      filter === "same" ? rows.filter((r) => r.same) :
      filter === "different" ? rows.filter((r) => !r.same) :
      rows;

    return {
      rows: filtered,
      total: rows.length,
      same: rows.filter((r) => r.same).length,
      different: rows.filter((r) => !r.same).length,
      myPoints: me.predictions
        .filter((p) => phase === "ALL" || p.phase === phase)
        .reduce((s, p) => s + p.points, 0),
      otherPoints: other.predictions
        .filter((p) => phase === "ALL" || p.phase === phase)
        .reduce((s, p) => s + p.points, 0),
    };
  }, [me, other, phase, filter, matchMap]);

  return (
    <div className="space-y-4">
      {/* Pick opponent */}
      <Card>
        <CardContent className="px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elige con quién comparar</p>
          <div className="space-y-1.5">
            {users
              .filter((u) => u.id !== currentUserId)
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => setCompareUserId(u.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors",
                    compareUserId === u.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  {u.image ? (
                    <Image src={u.image} alt={u.name} width={32} height={32} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {u.name[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium flex-1 truncate">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.predictions.length}p</span>
                  {compareUserId === u.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {comparison && other && (
        <>
          {/* Score summary */}
          <div className="grid grid-cols-3 gap-2">
            <Card className={cn(comparison.myPoints >= comparison.otherPoints && "border-primary/50 bg-primary/5")}>
              <CardContent className="px-3 py-3 text-center">
                {me?.image ? (
                  <Image src={me.image} alt={me.name ?? ""} width={28} height={28} className="rounded-full mx-auto mb-1" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold mx-auto mb-1">{me?.name[0]}</div>
                )}
                <p className="text-2xl font-black text-primary">{comparison.myPoints}</p>
                <p className="text-[10px] text-muted-foreground truncate">Tú</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-2 py-3 text-center space-y-1">
                <p className="text-xl font-bold text-green-600">{comparison.same}</p>
                <p className="text-[10px] text-muted-foreground">iguales</p>
                <p className="text-xl font-bold text-red-500">{comparison.different}</p>
                <p className="text-[10px] text-muted-foreground">distintas</p>
              </CardContent>
            </Card>
            <Card className={cn(comparison.otherPoints > comparison.myPoints && "border-orange-500/50 bg-orange-500/5")}>
              <CardContent className="px-3 py-3 text-center">
                {other.image ? (
                  <Image src={other.image} alt={other.name} width={28} height={28} className="rounded-full mx-auto mb-1" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold mx-auto mb-1">{other.name[0]}</div>
                )}
                <p className="text-2xl font-black text-orange-500">{comparison.otherPoints}</p>
                <p className="text-[10px] text-muted-foreground truncate">{other.name.split(" ")[0]}</p>
              </CardContent>
            </Card>
          </div>

          {/* Phase + filter controls */}
          <div className="space-y-2">
            <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
              {PHASES.map((ph) => (
                <button
                  key={ph.value}
                  onClick={() => setPhase(ph.value)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    phase === ph.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ph.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["all", "same", "different"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {f === "all" ? `Todos (${comparison.total})` : f === "same" ? `Iguales (${comparison.same})` : `Distintas (${comparison.different})`}
                </button>
              ))}
            </div>
          </div>

          {/* Headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="text-right">Tú</span>
            <span className="text-center w-16">Partido</span>
            <span>{other.name.split(" ")[0]}</span>
          </div>

          {/* Comparison rows */}
          <div className="space-y-1.5">
            {comparison.rows.map(({ matchId, myPred, otherPred, match, same }) => {
              const numId = matchId.replace("match_", "");
              const matchInfo = match || matchMap[numId];

              return (
                <div
                  key={matchId}
                  className={cn(
                    "rounded-xl border overflow-hidden",
                    same ? "border-green-500/40 bg-green-500/5" : "border-border"
                  )}
                >
                  {/* Match label */}
                  {matchInfo && (
                    <div className="flex items-center justify-center gap-1.5 px-3 pt-1.5 pb-0.5 text-[10px] text-muted-foreground">
                      <span className="font-medium">{translateCountry(matchInfo.home)}</span>
                      <span>vs</span>
                      <span className="font-medium">{translateCountry(matchInfo.away)}</span>
                    </div>
                  )}

                  {/* Scores */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-2">
                    {/* My score */}
                    <div className={cn(
                      "text-right flex items-center justify-end gap-1.5",
                    )}>
                      {myPred ? (
                        <>
                          {myPred.points === 5 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : myPred.points === 3 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-base font-black font-mono",
                            myPred.points === 5 && "text-green-600",
                            myPred.points === 3 && "text-blue-600",
                            myPred.points === 0 && "text-foreground",
                          )}>
                            {myPred.homeScore}–{myPred.awayScore}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">–</span>
                      )}
                    </div>

                    {/* Equal / different indicator */}
                    <div className="w-8 flex justify-center">
                      {same ? (
                        <span className="text-green-500 font-bold text-sm">=</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">≠</span>
                      )}
                    </div>

                    {/* Other score */}
                    <div className="flex items-center gap-1.5">
                      {otherPred ? (
                        <>
                          <span className={cn(
                            "text-base font-black font-mono",
                            otherPred.points === 5 && "text-green-600",
                            otherPred.points === 3 && "text-blue-600",
                            otherPred.points === 0 && "text-foreground",
                          )}>
                            {otherPred.homeScore}–{otherPred.awayScore}
                          </span>
                          {otherPred.points === 5 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : otherPred.points === 3 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">–</span>
                      )}
                    </div>
                  </div>

                  {/* Points row */}
                  {(myPred?.points !== undefined || otherPred?.points !== undefined) && (
                    <div className="grid grid-cols-[1fr_auto_1fr] px-3 pb-1.5 text-[10px] text-muted-foreground">
                      <span className="text-right">
                        {myPred && <span className={myPred.points > 0 ? "text-primary font-semibold" : ""}>+{myPred.points}pts</span>}
                      </span>
                      <span className="w-8" />
                      <span>
                        {otherPred && <span className={otherPred.points > 0 ? "text-orange-500 font-semibold" : ""}>+{otherPred.points}pts</span>}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {comparison.rows.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No hay predicciones para mostrar en este filtro
              </div>
            )}
          </div>
        </>
      )}

      {!compareUserId && (
        <p className="text-center text-sm text-muted-foreground py-6">
          Selecciona un participante arriba para empezar la comparación
        </p>
      )}
    </div>
  );
}
