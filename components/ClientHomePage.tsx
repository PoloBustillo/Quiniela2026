"use client";

import { useState, useMemo, useEffect } from "react";
import PredictionCard from "@/components/PredictionCard";
import { Calendar, Trophy, ChevronDown, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMatchDate } from "@/lib/points";

interface Match {
  id: string;
  matchNumber: number;
  homeTeam: { id: number | string; name: string; code: string; flag: string };
  awayTeam: { id: number | string; name: string; code: string; flag: string };
  date: string;
  stadium: string;
  city: string;
  country: string;
  stage: string;
  group?: string;
  phase?: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface PredictionMap {
  [key: string]: { homeScore: number; awayScore: number };
}

interface ClientHomePageProps {
  matches: Match[];
  predictionMap: PredictionMap;
}

const PHASE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "16vos",
  ROUND_OF_16: "8vos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semis",
  THIRD_PLACE: "3er Lugar",
  FINAL: "Final",
};

const getGroupKey = (match: Match): string => {
  if (match.phase && match.phase !== "GROUP_STAGE") return match.phase;
  if (match.group) return `Grupo ${match.group}`;
  return "Otros";
};

export default function ClientHomePage({
  matches,
  predictionMap,
}: ClientHomePageProps) {
  const [viewMode, setViewMode] = useState<"date" | "group">("date");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [groupSectionOpen, setGroupSectionOpen] = useState(true);
  const [knockoutSectionOpen, setKnockoutSectionOpen] = useState(true);
  const [serverOffset, setServerOffset] = useState(0);
  // UI-REC #6: quick filter state — remove this line (and filter chips + filteredMatches change below) to disable
  const [quickFilter, setQuickFilter] = useState<"all" | "today" | "missing">("all");
  const [showPast, setShowPast] = useState(false);
  useEffect(() => {
    fetch("/api/server-time", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setServerOffset(new Date(d.serverTime).getTime() - Date.now());
      })
      .catch(() => {});
  }, []);

  const matchesByDate = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const date = parseMatchDate(match.date).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "America/Mexico_City",
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [matches]);

  const matchesByGroup = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const group = getGroupKey(match);
        if (!acc[group]) acc[group] = [];
        acc[group].push(match);
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [matches]);

  const groups = useMemo(() => {
    const all = Object.keys(matchesByGroup);
    const groupStage = all.filter((g) => g.startsWith("Grupo ")).sort();
    const knockout = all
      .filter((g) => !g.startsWith("Grupo ") && g !== "Otros")
      .sort((a, b) => (PHASE_ORDER[a] ?? 999) - (PHASE_ORDER[b] ?? 999));
    return { groupStage, knockout };
  }, [matchesByGroup]);

  // Forzar re-evaluación periódica para que nowWithOffset sea actual
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // UI-REC #6: quick filter applied in date mode — revert to `return matchesByDate` in the date branch to disable
  const filteredMatches = useMemo(() => {
    const nowWithOffset = Date.now() + serverOffset;

    const hidePast = (rec: Record<string, Match[]>) => {
      if (showPast) return rec;
      const result: Record<string, Match[]> = {};
      for (const [day, dayMatches] of Object.entries(rec)) {
        const filtered = dayMatches.filter(
          (m) => {
            if (m.homeScore != null && m.awayScore != null) return false;
            return parseMatchDate(m.date).getTime() + 160 * 60 * 1000 > nowWithOffset;
          },
        );
        if (filtered.length > 0) result[day] = filtered;
      }
      return result;
    };

    if (viewMode === "group") {
      if (selectedGroup === "all") return hidePast(matchesByGroup);
      return hidePast({ [selectedGroup]: matchesByGroup[selectedGroup] || [] });
    }
    if (quickFilter === "today") {
      const todayKey = new Date().toLocaleDateString(
        "es-MX",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "America/Mexico_City",
        },
      );
      const todayMatches = matchesByDate[todayKey] ?? [];
      return todayMatches.length > 0 ? { [todayKey]: todayMatches } : {};
    }
    if (quickFilter === "missing") {
      const result: Record<string, Match[]> = {};
      for (const [day, dayMatches] of Object.entries(matchesByDate)) {
        const open = dayMatches.filter(
          (m) =>
            !predictionMap[m.id] &&
            (m.homeScore == null || m.awayScore == null) &&
            parseMatchDate(m.date).getTime() + 160 * 60 * 1000 > nowWithOffset,
        );
        if (open.length > 0) result[day] = open;
      }
      return result;
    }
    return hidePast(matchesByDate);
  }, [viewMode, selectedGroup, matchesByDate, matchesByGroup, quickFilter, serverOffset, predictionMap, showPast, tick]);

  const getGroupLabel = (key: string) => {
    if (key.startsWith("Grupo ")) return key;
    return PHASE_LABELS[key] || key;
  };

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 pb-2">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold">Mis Predicciones</h1>
        {/* UI-REC #5: progress counter — revert to `{matches.length} partidos` to disable */}
        <p className="text-xs text-muted-foreground">
          Mundial 2026 · {Object.keys(predictionMap).length}/{matches.length}{" "}
          guardadas
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-3">
        <button
          onClick={() => setViewMode("date")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === "date"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Por fecha
        </button>
        <button
          onClick={() => setViewMode("group")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === "group"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          Por fase
        </button>
      </div>

      {/* UI-REC #6: quick filter chips for date view — remove this block to disable */}
      {viewMode === "date" && (
        <div className="flex gap-2 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {(["all", "today", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                quickFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "Todos" : f === "today" ? "Hoy" : "Sin guardar"}
            </button>
          ))}
          <button
            onClick={() => setShowPast(!showPast)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1",
              showPast
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <History className="h-3 w-3" />
            Finalizados
          </button>
        </div>
      )}

      {/* Group/phase filter — two collapsible sections */}
      {viewMode === "group" && (
        <div className="space-y-2 mb-3">
          {/* Todos */}
          <button
            onClick={() => setSelectedGroup("all")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              selectedGroup === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground bg-muted/30",
            )}
          >
            Todos los partidos
          </button>

          {/* Grupos section */}
          {groups.groupStage.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <button
                onClick={() => setGroupSectionOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 text-sm font-semibold hover:bg-muted/60 transition-colors"
              >
                <span>Fase de Grupos</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    groupSectionOpen && "rotate-180",
                  )}
                />
              </button>
              {groupSectionOpen && (
                <div className="grid grid-cols-4 gap-px bg-border p-px">
                  {groups.groupStage.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={cn(
                        "py-2 text-xs font-medium transition-colors",
                        selectedGroup === g
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {g.replace("Grupo ", "G")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Knockout section */}
          {groups.knockout.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <button
                onClick={() => setKnockoutSectionOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 text-sm font-semibold hover:bg-muted/60 transition-colors"
              >
                <span>Eliminatorias</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    knockoutSectionOpen && "rotate-180",
                  )}
                />
              </button>
              {knockoutSectionOpen && (
                <div className="flex flex-wrap gap-px bg-border p-px">
                  {groups.knockout.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={cn(
                        "flex-1 min-w-[80px] py-2 text-xs font-medium transition-colors whitespace-nowrap",
                        selectedGroup === g
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {getGroupLabel(g)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Matches */}
      <div className="space-y-5">
        {(viewMode === "date"
          ? Object.entries(filteredMatches).sort(
              ([, a], [, b]) =>
                parseMatchDate(a[0].date).getTime() - parseMatchDate(b[0].date).getTime(),
            )
          : Object.entries(filteredMatches)
        ).map(([key, groupMatches]) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2 sticky top-12 md:top-14 z-10 bg-background/95 backdrop-blur py-1">
              {viewMode === "date" ? (
                <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Trophy className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <h2 className="text-sm font-semibold capitalize truncate">
                {viewMode === "date" ? key : getGroupLabel(key)}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                {groupMatches.length}p
              </span>
            </div>
            <div className="space-y-1.5">
              {groupMatches.map((match) => (
                <PredictionCard
                  key={match.id}
                  match={match}
                  existingPrediction={predictionMap[match.id]}
                  compact
                  serverOffset={serverOffset}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
