"use client";

import { useState, useMemo } from "react";
import PredictionCard from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  List,
  Calendar,
  Trophy,
  Target,
  CheckCircle2,
  Award,
} from "lucide-react";

interface Match {
  id: number;
  matchNumber: number;
  homeTeam: { id: number; name: string; code: string; flag: string };
  awayTeam: { id: number; name: string; code: string; flag: string };
  date: string;
  stadium: string;
  city: string;
  country: string;
  stage: string;
  group?: string;
  phase?: string;
}

interface PredictionMap {
  [key: number]: { homeScore: number; awayScore: number };
}

interface ClientHomePageProps {
  matches: Match[];
  predictionMap: PredictionMap;
  totalPredictions: number;
  totalPoints: number;
}

// Orden de fases para sorting
const PHASE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

// Mapeo de fases a nombres en español
const getPhaseDisplay = (phase: string): string => {
  const phaseNames: Record<string, string> = {
    GROUP_STAGE: "Fase de Grupos",
    ROUND_OF_32: "32avos de Final",
    ROUND_OF_16: "16avos de Final",
    QUARTER_FINAL: "Cuartos de Final",
    SEMI_FINAL: "Semifinales",
    THIRD_PLACE: "Tercer Lugar",
    FINAL: "Final",
  };
  return phaseNames[phase] || phase;
};

// Mapeo de grupos para determinar el grupo de cada partido
const getGroupFromMatch = (match: Match): string => {
  // Si es una fase eliminatoria, usar el nombre de la fase
  if (match.phase && match.phase !== "GROUP_STAGE") {
    return match.phase;
  }

  // Usar el campo group directamente del JSON para fase de grupos
  if (match.group) {
    return `Grupo ${match.group}`;
  }
  return "Otros";
};

export default function ClientHomePage({
  matches,
  predictionMap,
  totalPredictions,
  totalPoints,
}: ClientHomePageProps) {
  const [viewMode, setViewMode] = useState<"date" | "group">("date");
  const [displayMode, setDisplayMode] = useState<"cards" | "list">("list");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Agrupar partidos por fecha
  const matchesByDate = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const date = new Date(match.date).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(match);
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [matches]);

  // Agrupar partidos por grupo
  const matchesByGroup = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const group = getGroupFromMatch(match);

        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(match);
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [matches]);

  const groups = useMemo(() => {
    const allGroups = Object.keys(matchesByGroup);

    // Separar grupos de fase de grupos y fases eliminatorias
    const groupStageGroups = allGroups
      .filter((g) => g.startsWith("Grupo "))
      .sort();
    const knockoutPhases = allGroups
      .filter((g) => !g.startsWith("Grupo ") && g !== "Otros")
      .sort((a, b) => {
        const orderA = PHASE_ORDER[a] ?? 999;
        const orderB = PHASE_ORDER[b] ?? 999;
        return orderA - orderB;
      });

    // Combinar: primero fase de grupos, luego eliminatorias
    return [...groupStageGroups, ...knockoutPhases];
  }, [matchesByGroup]);

  const filteredMatches = useMemo(() => {
    if (viewMode === "date") {
      return matchesByDate;
    } else {
      // viewMode === "group"
      if (selectedGroup === "all") {
        return matchesByGroup;
      }
      return { [selectedGroup]: matchesByGroup[selectedGroup] || [] };
    }
  }, [viewMode, selectedGroup, matchesByDate, matchesByGroup]);

  const completionPercentage = Math.round(
    (totalPredictions / matches.length) * 100,
  );

  return (
    <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6 md:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
          Tus Predicciones
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Ingresa tus predicciones para cada partido del Mundial 2026
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalPredictions}
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Predicciones
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-3 sm:p-4 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
            {matches.length}
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Partidos
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalPoints}
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Puntos
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-3 sm:p-4 rounded-lg border border-green-500/20">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
            {completionPercentage}%
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Completado
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* View Mode Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              Agrupar por:
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant={viewMode === "date" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("date")}
                className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Fecha</span>
              </Button>
              <Button
                variant={viewMode === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("group")}
                className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Fase</span>
              </Button>
            </div>
          </div>

          {/* Display Mode Selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium">Vista:</label>
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant={displayMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setDisplayMode("cards")}
                className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Tarjetas</span>
              </Button>
              <Button
                variant={displayMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setDisplayMode("list")}
                className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Lista</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Group Filter (only visible in group mode) */}
        {viewMode === "group" && (
          <div className="border-t pt-3 sm:pt-4">
            <label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
              Filtrar fase:
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                variant={selectedGroup === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGroup("all")}
                className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                Todas
              </Button>
              {groups.map((group) => (
                <Button
                  key={group}
                  variant={selectedGroup === group ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGroup(group)}
                  className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                >
                  {group.startsWith("Grupo ") ? group : getPhaseDisplay(group)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matches Display */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {Object.entries(filteredMatches).map(([key, groupMatches]) => (
          <div key={key}>
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2.5 sm:mb-3 md:mb-4 capitalize px-0.5 flex items-center gap-1.5 sm:gap-2">
              {viewMode === "date" ? (
                <>
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base md:text-lg">{key}</span>
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base md:text-lg">
                    {key.startsWith("Grupo ") ? key : getPhaseDisplay(key)}
                  </span>
                </>
              )}
            </h2>
            <div
              className={`grid ${
                displayMode === "list"
                  ? "grid-cols-1 max-w-5xl mx-auto gap-1.5 sm:gap-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4"
              }`}
            >
              {groupMatches.map((match) => (
                <PredictionCard
                  key={match.id}
                  match={match}
                  existingPrediction={predictionMap[match.id]}
                  compact={displayMode === "list"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
