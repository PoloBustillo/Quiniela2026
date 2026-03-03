"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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

  // Server-time offset (anti-cheat): fetch once per card mount.
  // Prevents users from changing their system clock to unlock closed matches.
  // The server validates independently — this just keeps the UI honest.
  const [serverOffset, setServerOffset] = useState(0); // ms
  useEffect(() => {
    fetch("/api/server-time", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const offset = new Date(d.serverTime).getTime() - Date.now();
        setServerOffset(offset);
      })
      .catch(() => {
        // Silently ignore; server-side validation is the real gate.
      });
  }, []);

  const isPast = matchDate < new Date(Date.now() + serverOffset);

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

  // ── Shared score stepper ────────────────────────────────────────────────────
  const ScoreControl = ({ team, value }: { team: "home" | "away"; value: number }) => (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => decrementScore(team)}
        disabled={isDisabled || isSaving || value === 0}
        className="h-9 w-9 flex items-center justify-center rounded-l-lg border border-border bg-background active:bg-muted disabled:opacity-30 transition-colors touch-manipulation select-none"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min="0"
        max="20"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleInputChange(team, e.target.value)
        }
        disabled={isDisabled || isSaving}
        className="w-10 h-9 text-center text-base font-bold px-0 rounded-none border-x-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="button"
        onClick={() => incrementScore(team)}
        disabled={isDisabled || isSaving || value === 20}
        className="h-9 w-9 flex items-center justify-center rounded-r-lg border border-border bg-background active:bg-muted disabled:opacity-30 transition-colors touch-manipulation select-none"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  // ── COMPACT (list) mode ─────────────────────────────────────────────────────
  if (compact) {
    return (
      <Card
        className={cn(
          "overflow-hidden transition-all",
          !isPast && saved && "border-green-500/50 bg-green-500/5",
          isPast && "opacity-70"
        )}
      >
        <CardContent className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Home team */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
              <p className="text-xs font-medium truncate text-right leading-tight">
                {translateCountry(match.homeTeam.name)}
              </p>
              <div className="w-7 h-5 flex-shrink-0 relative">
                <Image src={match.homeTeam.flag} alt={match.homeTeam.name} fill
                  className="object-contain" unoptimized />
              </div>
            </div>

            {/* Score controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ScoreControl team="home" value={homeScore} />
              <span className="text-muted-foreground font-bold text-xs w-3 text-center select-none">–</span>
              <ScoreControl team="away" value={awayScore} />
            </div>

            {/* Away team */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-7 h-5 flex-shrink-0 relative">
                <Image src={match.awayTeam.flag} alt={match.awayTeam.name} fill
                  className="object-contain" unoptimized />
              </div>
              <p className="text-xs font-medium truncate leading-tight">
                {translateCountry(match.awayTeam.name)}
              </p>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isDisabled || isSaving}
              className={cn(
                "flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors touch-manipulation font-bold text-sm select-none border",
                isPast
                  ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent"
                  : saved
                    ? "bg-green-500/10 text-green-600 border-green-500/40"
                    : "bg-primary text-primary-foreground border-transparent active:opacity-80"
              )}
            >
              {isSaving ? (
                <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
              ) : isPast ? "🔒" : saved ? "✓" : "↑"}
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground gap-2">
            <span className="truncate">
              {match.group ? `Grupo ${match.group}` : match.stage} · {translateCity(match.city)}
            </span>
            <span className="flex-shrink-0">
              {matchDate.toLocaleDateString("es-MX", {
                month: "short", day: "numeric", timeZone: "America/Mexico_City",
              })}{" "}
              {matchDate.toLocaleTimeString("es-MX", {
                hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
              })}
            </span>
          </div>
          {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  // ── CARD mode (desktop grid) ────────────────────────────────────────────────
  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all",
        saved && "border-green-500/50 bg-green-500/5"
      )}
    >
      <CardContent className="p-4 md:p-6">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">
            {match.group ? `Grupo ${match.group}` : match.stage}
          </p>
          <p className="text-xs font-medium mt-0.5">
            {matchDate.toLocaleDateString("es-MX", {
              weekday: "short", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
            })}
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src={match.homeTeam.flag} alt={match.homeTeam.name} fill
                  className="object-cover rounded-md" unoptimized />
              </div>
              <p className="text-sm font-medium truncate">{translateCountry(match.homeTeam.name)}</p>
            </div>
            <ScoreControl team="home" value={homeScore} />
          </div>
          <div className="text-center text-xs text-muted-foreground font-medium">VS</div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src={match.awayTeam.flag} alt={match.awayTeam.name} fill
                  className="object-cover rounded-md" unoptimized />
              </div>
              <p className="text-sm font-medium truncate">{translateCountry(match.awayTeam.name)}</p>
            </div>
            <ScoreControl team="away" value={awayScore} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4 line-clamp-1">
          {translateStadium(match.stadium)} · {translateCity(match.city)}
        </p>

        {error && (
          <div className="mb-3 text-xs text-destructive text-center bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isDisabled || isSaving}
          className={cn(
            "w-full h-11 rounded-lg text-sm font-semibold touch-manipulation transition-colors active:opacity-80 border",
            isPast
              ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent"
              : saved
                ? "bg-green-500/10 text-green-700 border-green-500/40"
                : "bg-primary text-primary-foreground border-transparent"
          )}
        >
          {isSaving ? "Guardando..." : isPast ? "🔒 Cerrado" : saved ? "✓ Guardado" : "Guardar Prediccion"}
        </button>
      </CardContent>
    </Card>
  );
}
