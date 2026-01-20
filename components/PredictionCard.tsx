"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  translateCountry,
  translateCity,
  translateStadium,
} from "@/lib/translations";

interface Team {
  id: number;
  name: string;
  code: string;
  flag: string;
}

interface Match {
  id: number;
  matchNumber: number;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  stadium: string;
  city: string;
  country: string;
  stage: string;
  group?: string; // Optional group property
}

interface PredictionCardProps {
  match: Match;
  existingPrediction?: {
    homeScore: number;
    awayScore: number;
  };
  compact?: boolean;
}

export default function PredictionCard({
  match,
  existingPrediction,
  compact = false,
}: PredictionCardProps) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.homeScore ?? 0,
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.awayScore ?? 0,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingPrediction);
  const [error, setError] = useState<string | null>(null);

  const matchDate = new Date(match.date);
  const isPast = matchDate < new Date();

  // Verificar si algún equipo es TBD (Por Definir)
  const isTBD = match.homeTeam.code === "TBD" || match.awayTeam.code === "TBD";

  // Deshabilitar predicciones si es TBD o si el partido ya pasó
  const isDisabled = isTBD || isPast;

  // Detectar si los scores han cambiado respecto a la predicción guardada
  useEffect(() => {
    if (existingPrediction) {
      const hasChanged =
        homeScore !== existingPrediction.homeScore ||
        awayScore !== existingPrediction.awayScore;

      if (hasChanged && saved) {
        setSaved(false);
      } else if (!hasChanged && !saved) {
        setSaved(true);
      }
    }
  }, [homeScore, awayScore, existingPrediction, saved]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: homeScore,
          awayScore: awayScore,
        }),
      });

      if (response.ok) {
        setSaved(true);
        // Refrescar la página para actualizar las estadísticas
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Error al guardar la predicción");
      }
    } catch (error) {
      console.error("Error saving prediction:", error);
      setError("Error al guardar la predicción");
    } finally {
      setIsSaving(false);
    }
  };

  const incrementScore = (team: "home" | "away") => {
    if (isDisabled) return;
    if (team === "home") {
      setHomeScore((prev) => Math.min(prev + 1, 20));
    } else {
      setAwayScore((prev) => Math.min(prev + 1, 20));
    }
  };

  const decrementScore = (team: "home" | "away") => {
    if (isDisabled) return;
    if (team === "home") {
      setHomeScore((prev) => Math.max(prev - 1, 0));
    } else {
      setAwayScore((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleInputChange = (team: "home" | "away", value: string) => {
    if (isDisabled) return;
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(20, numValue));
    if (team === "home") {
      setHomeScore(clampedValue);
    } else {
      setAwayScore(clampedValue);
    }
  };

  return (
    <>
      {compact ? (
        // Modo Compacto - Layout horizontal para lista
        <Card
          className={`overflow-hidden hover:shadow-md transition-all ${
            saved ? "border-green-500/50 bg-green-500/5" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Home Team - Nombre y Bandera */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
                <p className="text-xs sm:text-sm font-medium truncate text-right">
                  {translateCountry(match.homeTeam.name)}
                </p>
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <Image
                    src={match.homeTeam.flag}
                    alt={match.homeTeam.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
              </div>

              {/* Scores Section - Centrado */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Home Score */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => decrementScore("home")}
                    disabled={isDisabled || isSaving || homeScore === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("home", e.target.value)
                    }
                    disabled={isDisabled || isSaving}
                    className="w-11 sm:w-14 h-9 sm:h-10 text-center text-lg sm:text-xl font-bold px-0.5 touch-manipulation"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => incrementScore("home")}
                    disabled={isDisabled || isSaving || homeScore === 20}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* VS Separator */}
                <span className="text-xs sm:text-sm text-muted-foreground font-medium px-1">
                  -
                </span>

                {/* Away Score */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => decrementScore("away")}
                    disabled={isDisabled || isSaving || awayScore === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("away", e.target.value)
                    }
                    disabled={isDisabled || isSaving}
                    className="w-11 sm:w-14 h-9 sm:h-10 text-center text-lg sm:text-xl font-bold px-0.5 touch-manipulation"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => incrementScore("away")}
                    disabled={isDisabled || isSaving || awayScore === 20}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Away Team - Bandera y Nombre */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <Image
                    src={match.awayTeam.flag}
                    alt={match.awayTeam.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium truncate text-left">
                  {translateCountry(match.awayTeam.name)}
                </p>
              </div>

              {/* Save Button - Compacto */}
              <Button
                onClick={handleSave}
                disabled={isDisabled || isSaving}
                size="sm"
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0 touch-manipulation active:scale-95 transition-transform"
                variant={saved ? "outline" : "default"}
              >
                {saved ? "✓" : "G"}
              </Button>
            </div>

            {/* Info adicional en una segunda línea */}
            <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <span>{match.group ? `Grupo ${match.group}` : match.stage}</span>
              <span>
                {matchDate.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Mexico_City",
                })}
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-2 text-xs text-destructive text-center">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Modo Normal - Layout vertical para grid
        <Card
          className={`overflow-hidden hover:shadow-lg transition-all ${
            saved ? "border-green-500/50 bg-green-500/5" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-4 md:p-6">
            {/* Match Header */}
            <div className="mb-3 sm:mb-4">
              <p className="text-xs text-muted-foreground mb-1">
                {match.group ? `Grupo ${match.group}` : match.stage}
              </p>
              <p className="text-xs sm:text-sm font-medium">
                {matchDate.toLocaleDateString("es-MX", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Mexico_City",
                })}
              </p>
            </div>

            {/* Teams and Prediction Inputs */}
            <div className="space-y-3 sm:space-y-4 mb-4">
              {/* Home Team */}
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <Image
                      src={match.homeTeam.flag}
                      alt={match.homeTeam.name}
                      fill
                      className="object-cover rounded-md"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-left truncate">
                    {translateCountry(match.homeTeam.name)}
                  </p>
                </div>

                {/* Home Score Control */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-12 sm:w-12 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => decrementScore("home")}
                    disabled={isDisabled || isSaving || homeScore === 0}
                  >
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("home", e.target.value)
                    }
                    disabled={isDisabled || isSaving}
                    className="w-14 sm:w-20 h-11 sm:h-12 text-center text-2xl sm:text-3xl font-bold px-1 touch-manipulation"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-12 sm:w-12 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => incrementScore("home")}
                    disabled={isDisabled || isSaving || homeScore === 20}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  VS
                </span>
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <Image
                      src={match.awayTeam.flag}
                      alt={match.awayTeam.name}
                      fill
                      className="object-cover rounded-md"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-left truncate">
                    {translateCountry(match.awayTeam.name)}
                  </p>
                </div>

                {/* Away Score Control */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-12 sm:w-12 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => decrementScore("away")}
                    disabled={isDisabled || isSaving || awayScore === 0}
                  >
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("away", e.target.value)
                    }
                    disabled={isDisabled || isSaving}
                    className="w-14 sm:w-20 h-11 sm:h-12 text-center text-2xl sm:text-3xl font-bold px-1 touch-manipulation"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-12 sm:w-12 touch-manipulation active:scale-95 transition-transform"
                    onClick={() => incrementScore("away")}
                    disabled={isDisabled || isSaving || awayScore === 20}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Stadium Info */}
            <p className="text-xs text-muted-foreground text-center mb-3 sm:mb-4 line-clamp-2">
              {translateStadium(match.stadium)} • {translateCity(match.city)},{" "}
              {translateCountry(match.country)}
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-3 text-xs text-destructive text-center bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isDisabled || isSaving}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold touch-manipulation active:scale-[0.98] transition-transform"
              variant={saved ? "outline" : "default"}
            >
              {isSaving
                ? "Guardando..."
                : saved
                  ? "✓ Guardado"
                  : isDisabled
                    ? "No Disponible"
                    : "Guardar Predicción"}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
