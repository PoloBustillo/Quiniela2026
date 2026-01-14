"use client";

import { useState, useMemo } from "react";
import PredictionCard from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Mapeo de grupos para determinar el grupo de cada partido
const getGroupFromMatch = (match: Match): string => {
  // Si es una fase eliminatoria, usar el nombre de la fase
  if (match.phase && match.phase !== "GROUP_STAGE") {
    const phaseNames: Record<string, string> = {
      ROUND_OF_32: "32avos",
      ROUND_OF_16: "16avos",
      QUARTER_FINAL: "Cuartos",
      SEMI_FINAL: "Semifinales",
      THIRD_PLACE: "3er Lugar",
      FINAL: "Final",
    };
    return phaseNames[match.phase] || match.phase;
  }
  
  // Usar el campo group directamente del JSON para fase de grupos
  if (match.group) {
    return match.group;
  }
  return "Otros";
};

export default function ClientHomePage({
  matches,
  predictionMap,
  totalPredictions,
  totalPoints,
}: ClientHomePageProps) {
  const [viewMode, setViewMode] = useState<"date" | "group" | "list">("date");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Agrupar partidos por fecha
  const matchesByDate = useMemo(() => {
    return matches.reduce((acc, match) => {
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
    }, {} as Record<string, Match[]>);
  }, [matches]);

  // Agrupar partidos por grupo
  const matchesByGroup = useMemo(() => {
    return matches.reduce((acc, match) => {
      const group = getGroupFromMatch(match);

      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [matches]);

  const groups = useMemo(() => {
    return Object.keys(matchesByGroup).sort();
  }, [matchesByGroup]);

  const filteredMatches = useMemo(() => {
    if (viewMode === "date") {
      return matchesByDate;
    } else if (viewMode === "group") {
      if (selectedGroup === "all") {
        return matchesByGroup;
      }
      return { [selectedGroup]: matchesByGroup[selectedGroup] || [] };
    } else {
      // Vista de lista: todos los partidos sin agrupar
      return { "Todos los Partidos": matches };
    }
  }, [viewMode, selectedGroup, matchesByDate, matchesByGroup, matches]);

  const completionPercentage = Math.round(
    (totalPredictions / matches.length) * 100
  );

  return (
    <div className="container max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          Tus Predicciones
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Ingresa tus predicciones para cada partido del Mundial 2026
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-card p-3 sm:p-4 rounded-lg border">
          <p className="text-xl sm:text-2xl font-bold">{totalPredictions}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Predicciones
          </p>
        </div>
        <div className="bg-card p-3 sm:p-4 rounded-lg border">
          <p className="text-xl sm:text-2xl font-bold">{matches.length}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Partidos Totales
          </p>
        </div>
        <div className="bg-card p-3 sm:p-4 rounded-lg border">
          <p className="text-xl sm:text-2xl font-bold">{totalPoints}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Puntos</p>
        </div>
        <div className="bg-card p-3 sm:p-4 rounded-lg border">
          <p className="text-xl sm:text-2xl font-bold">
            {completionPercentage}%
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Completado</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(v: string) =>
          setViewMode(v as "date" | "group" | "list")
        }
        className="mb-4 sm:mb-6"
      >
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
          <TabsTrigger value="date" className="text-xs sm:text-sm md:text-base">
            Por Fecha
          </TabsTrigger>
          <TabsTrigger
            value="group"
            className="text-xs sm:text-sm md:text-base"
          >
            Por Grupo
          </TabsTrigger>
          <TabsTrigger value="list" className="text-xs sm:text-sm md:text-base">
            Lista
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Group Filter (only visible in group mode) */}
      {viewMode === "group" && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 justify-center">
          <Button
            variant={selectedGroup === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroup("all")}
            className="text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            Todos
          </Button>
          {groups.map((group) => (
            <Button
              key={group}
              variant={selectedGroup === group ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroup(group)}
              className="text-xs sm:text-sm h-8 px-2 sm:px-3"
            >
              Grupo {group}
            </Button>
          ))}
        </div>
      )}

      {/* Matches Display */}
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(filteredMatches).map(([key, groupMatches]) => (
          <div key={key}>
            {viewMode !== "list" && (
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 capitalize px-1">
                {viewMode === "date"
                  ? key
                  : key.includes("avos") || key === "Cuartos" || key === "Semifinales" || key === "3er Lugar" || key === "Final"
                  ? key
                  : `Grupo ${key}`}
              </h2>
            )}
            <div
              className={`grid ${
                viewMode === "list"
                  ? "grid-cols-1 max-w-4xl mx-auto gap-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              }`}
            >
              {groupMatches.map((match) => (
                <PredictionCard
                  key={match.id}
                  match={match}
                  existingPrediction={predictionMap[match.id]}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
