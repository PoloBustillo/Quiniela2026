"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/lib/use-countdown";
import {
  translateCountry,
  translateCity,
  translateStadium,
} from "@/lib/translations";
import { getPlayerForTeam } from "@/lib/team-players";
import { calculatePoints, parseMatchDate } from "@/lib/points";

interface Team {
  id: number | string;
  name: string;
  code: string;
  flag: string;
}

interface Match {
  id: string;
  matchNumber: number;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  stadium: string;
  city: string;
  country: string;
  stage: string;
  group?: string; // Optional group property
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
}

interface PredictionCardProps {
  match: Match;
  existingPrediction?: {
    homeScore: number;
    awayScore: number;
  };
  compact?: boolean;
  /** Pre-fetched server-time offset in ms. If provided, skips the per-card /api/server-time request. */
  serverOffset?: number;
}

export default function PredictionCard({
  match,
  existingPrediction,
  compact = false,
  serverOffset: initialServerOffset,
}: PredictionCardProps) {
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.homeScore ?? 0,
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.awayScore ?? 0,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingPrediction);
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef(
    existingPrediction
      ? { homeScore: existingPrediction.homeScore, awayScore: existingPrediction.awayScore }
      : null,
  );
  // UI-REC #3: brief success ring — remove this line (and its usages below) to disable
  const [justSaved, setJustSaved] = useState(false);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Goal ball animation state
  const [ballAnim, setBallAnim] = useState<{ key: number; side: "home" | "away" } | null>(null);
  const ballKeyRef = useRef(0);

  const matchDate = parseMatchDate(match.date);

  // Server-time offset (anti-cheat): keeps UI lock in sync with server clock.
  // If a parent passes the offset (recommended), skip the per-card fetch.
  const [serverOffset, setServerOffset] = useState(initialServerOffset ?? 0); // ms
  useEffect(() => {
    if (initialServerOffset !== undefined) return;
    fetch("/api/server-time", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const offset = new Date(d.serverTime).getTime() - Date.now();
        setServerOffset(offset);
      })
      .catch(() => {
        // Silently ignore; server-side validation is the real gate.
      });
  }, [initialServerOffset]);

  const isFinished =
    match.status === "FINISHED" ||
    (match.homeScore != null && match.awayScore != null);
  const isPast = isFinished || matchDate < new Date(Date.now() + serverOffset);

  // Verificar si algún equipo es TBD (Por Definir)
  const isTBD = match.homeTeam.code === "TBD" || match.awayTeam.code === "TBD";

  // Deshabilitar predicciones si es TBD o si el partido ya pasó
  const isDisabled = isTBD || isPast;

  // Detectar si los scores han cambiado respecto al último guardado
  useEffect(() => {
    if (lastSavedRef.current) {
      const hasChanged =
        homeScore !== lastSavedRef.current.homeScore ||
        awayScore !== lastSavedRef.current.awayScore;

      if (hasChanged && saved) {
        setSaved(false);
      } else if (!hasChanged && !saved) {
        setSaved(true);
      }
    }
  }, [homeScore, awayScore, saved]);

  const handleSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (isSaving || isDisabled) return;
    setError(null);
    // Actualizar ref ANTES del estado para que el efecto vea el nuevo valor
    const prevSaved = lastSavedRef.current;
    lastSavedRef.current = { homeScore, awayScore };
    // UI-REC #7: optimistic save — UI commits instantly, rolls back on error.
    // To revert: move setSaved(true) + setJustSaved block back inside the `if (response.ok)` branch.
    setSaved(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
    setIsSaving(true);
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
        // Guardar predicción en localStorage para comparar cambios
        try {
          localStorage.setItem(
            `pred-${match.id}`,
            JSON.stringify({ homeScore, awayScore, savedAt: Date.now() }),
          );
        } catch {
          // ignore localStorage errors
        }
        // Scroll preservado: no hacemos router.refresh() para evitar recarga y scroll-to-top
      } else {
        // Revertir ref y estado
        lastSavedRef.current = prevSaved;
        setSaved(false);
        setJustSaved(false);
        const data = await response.json();
        setError(data.error || "Error al guardar la predicción");
      }
    } catch {
      // Revertir ref y estado
      lastSavedRef.current = prevSaved;
      setSaved(false);
      setJustSaved(false);
      setError("Error al guardar la predicción");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-guardado debounced (1.2s) cuando hay cambios sin guardar
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (isDisabled || isSaving) return;

    const hasChanged =
      !lastSavedRef.current ||
      homeScore !== lastSavedRef.current.homeScore ||
      awayScore !== lastSavedRef.current.awayScore;

    if (hasChanged) {
      autoSaveTimerRef.current = setTimeout(() => {
        void handleSaveRef.current();
      }, 1200);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [homeScore, awayScore, isDisabled, isSaving]);

  const triggerBall = (side: "home" | "away") => {
    ballKeyRef.current += 1;
    setBallAnim({ key: ballKeyRef.current, side });
  };

  const incrementScore = (team: "home" | "away") => {
    if (isDisabled) return;
    if (team === "home") {
      triggerBall("home");
      setHomeScore((prev) => Math.min(prev + 1, 20));
    } else {
      triggerBall("away");
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
      if (clampedValue > homeScore) triggerBall("home");
      setHomeScore(clampedValue);
    } else {
      if (clampedValue > awayScore) triggerBall("away");
      setAwayScore(clampedValue);
    }
  };

  // ── Shared score stepper ────────────────────────────────────────────────────
  const ScoreControl = ({
    team,
    value,
  }: {
    team: "home" | "away";
    value: number;
  }) => (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => decrementScore(team)}
        disabled={isDisabled || isSaving || value === 0}
        // UI-REC #2: aria-label — remove this line if not needed
        aria-label={`Reducir goles ${team === "home" ? "local" : "visitante"}`}
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
        // UI-REC #2: aria-label — remove this line if not needed
        aria-label={`Aumentar goles ${team === "home" ? "local" : "visitante"}`}
        className="h-9 w-9 flex items-center justify-center rounded-r-lg border border-border bg-background active:bg-muted disabled:opacity-30 transition-colors touch-manipulation select-none"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const homePlayerSrc = isPast ? null : getPlayerForTeam(match.homeTeam);
  const awayPlayerSrc = isPast ? null : getPlayerForTeam(match.awayTeam);

  const countdown = useCountdown(matchDate, serverOffset);

  const visualWinner =
    homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";

  const CompactScoreInput = ({
    team,
    value,
  }: {
    team: "home" | "away";
    value: number;
  }) => (
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
      className="w-12 h-10 text-center text-lg font-black px-0 rounded-lg border"
    />
  );

  const SideFigure = ({
    team,
    playerSrc,
    side,
  }: {
    team: Team;
    playerSrc: string | null;
    side: "home" | "away";
  }) => {
    const isWinner = visualWinner === side;
    const isLoser = visualWinner !== side && visualWinner !== "draw";
    const isDraw = visualWinner === "draw";

    if (playerSrc) {
      return (
        <div
          className="relative h-28 w-20 sm:h-32 sm:w-24 md:h-36 md:w-28 flex-shrink-0 select-none transition-transform duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95"
          aria-hidden="true"
        >
          <Image
            src={team.flag}
            alt={team.name}
            fill
            className="object-cover rounded-xl opacity-40"
            unoptimized
            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
          />
          <Image
            src={playerSrc}
            alt=""
            fill
            className={cn(
              "object-contain transition-all duration-300",
              isWinner && "scale-105 drop-shadow-lg",
              isLoser && "grayscale opacity-50",
              isDraw && "opacity-75",
            )}
            unoptimized
            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
          />
        </div>
      );
    }

    return (
      <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 flex-shrink-0">
        <Image
          src={team.flag}
          alt={team.name}
          fill
          className="object-contain"
          unoptimized
          sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
        />
      </div>
    );
  };

  // ── COMPACT (list) mode ─────────────────────────────────────────────────────
  if (compact) {
    return (
      <Card
        className={cn(
          "overflow-hidden transition-all",
          !isPast && saved && "border-green-500/50 bg-green-500/5",
          isPast && "opacity-70",
          // UI-REC #3: brief success ring — remove this line to disable
          justSaved && "ring-2 ring-green-500/60 ring-offset-background ring-offset-1",
        )}
      >
        <CardContent className="py-3 px-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="flex items-center justify-center">
              <SideFigure
                team={match.homeTeam}
                playerSrc={homePlayerSrc}
                side="home"
              />
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 w-full">
                <div className="flex items-center justify-end gap-1 min-w-0">
                  <span className="sm:hidden font-mono font-bold text-xs tracking-wide">
                    {match.homeTeam.code}
                  </span>
                  <div className="relative w-5 h-4 sm:hidden flex-shrink-0">
                    <Image
                      src={match.homeTeam.flag}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="hidden sm:block text-sm font-medium line-clamp-2 text-right leading-tight">
                    {translateCountry(match.homeTeam.name)}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold text-center w-5">
                  vs
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <div className="relative w-5 h-4 sm:hidden flex-shrink-0">
                    <Image
                      src={match.awayTeam.flag}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="sm:hidden font-mono font-bold text-xs tracking-wide">
                    {match.awayTeam.code}
                  </span>
                  <p className="hidden sm:block text-sm font-medium line-clamp-2 leading-tight">
                    {translateCountry(match.awayTeam.name)}
                  </p>
                </div>
              </div>

              <div className="relative mt-2 flex items-center justify-center gap-2">
                {ballAnim && (
                  <div
                    key={ballAnim.key}
                    onAnimationEnd={() => setBallAnim(null)}
                    className={cn(
                      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-2xl pointer-events-none",
                      ballAnim.side === "home"
                        ? "animate-ball-fly-home"
                        : "animate-ball-fly-away",
                    )}
                  >
                    ⚽
                  </div>
                )}
                <CompactScoreInput team="home" value={homeScore} />
                <span className="text-muted-foreground font-bold text-sm w-3 text-center select-none">
                  –
                </span>
                <CompactScoreInput team="away" value={awayScore} />
                {(!saved || isSaving) && !isPast && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    aria-label={saved ? "Predicción guardada" : "Guardar predicción"}
                    className={cn(
                      "flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all active:scale-95 touch-manipulation font-bold text-sm select-none border",
                      isSaving
                        ? "bg-muted text-foreground cursor-wait border-transparent"
                        : "bg-primary text-primary-foreground border-transparent active:opacity-80",
                    )}
                  >
                    {isSaving ? (
                      <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      "↑"
                    )}
                  </button>
                )}
              </div>

          {/* Result indicator — visible once match has a score */}
          {isPast &&
            match.homeScore != null &&
            match.awayScore != null &&
            (() => {
              const pts = existingPrediction
                ? calculatePoints(
                    existingPrediction.homeScore,
                    existingPrediction.awayScore,
                    match.homeScore,
                    match.awayScore,
                  )
                : null;
              return (
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-[11px] text-muted-foreground">
                    Resultado:{" "}
                    <span className="font-bold text-foreground">
                      {match.homeScore}–{match.awayScore}
                    </span>
                  </span>
                  {pts != null ? (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        pts === 5
                          ? "bg-green-500/15 text-green-600"
                          : pts === 3
                            ? "bg-blue-500/15 text-blue-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {pts === 5
                        ? "✓ Exacto"
                        : pts === 3
                          ? "✓ Ganador"
                          : "✗ 0pts"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      Sin predicción
                    </span>
                  )}
                </div>
              );
            })()}

          {/* Meta row — hora + countdown en mobile · sm+: detalles completos */}
          <div className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground text-center w-full">
            <span className="hidden sm:inline">
              {match.group ? `Grupo ${match.group}` : match.stage} ·{" "}
              {translateCity(match.city)} ·{" "}
            </span>
            <span>
              {matchDate.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Mexico_City",
              })}
            </span>
            {!isPast && (
              <span className="text-muted-foreground/70 ml-1">
                (faltan {countdown})
              </span>
            )}
            <span className="hidden sm:inline">
              {(() => {
                if (match.id.startsWith("match_")) {
                  const detailId = match.id.replace("match_", "");
                  if (!detailId) return null;
                  return (
                    <Link
                      href={`/matches/${encodeURIComponent(detailId)}`}
                      className="ml-2 text-primary font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Detalles →
                    </Link>
                  );
                }
                return null;
              })()}
            </span>
          </div>
              {error && (
                <p className="mt-1 text-[11px] text-destructive">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-center">
              <SideFigure
                team={match.awayTeam}
                playerSrc={awayPlayerSrc}
                side="away"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── CARD mode (desktop grid) ────────────────────────────────────────────────
  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all",
        saved && "border-green-500/50 bg-green-500/5",
      )}
    >
      <CardContent className="p-4 md:p-6">
        <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              {match.group ? `Grupo ${match.group}` : match.stage}
            </p>
            <p className="text-xs font-medium mt-0.5">
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

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={match.homeTeam.flag}
                    alt={match.homeTeam.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
                <p className="text-sm font-medium line-clamp-2 leading-tight">
                  {translateCountry(match.homeTeam.name)}
                </p>
              </div>
              <ScoreControl team="home" value={homeScore} />
            </div>
            <div className="text-center text-xs text-muted-foreground font-medium">
              VS
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={match.awayTeam.flag}
                    alt={match.awayTeam.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
                <p className="text-sm font-medium line-clamp-2 leading-tight">
                  {translateCountry(match.awayTeam.name)}
                </p>
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
                : "bg-primary text-primary-foreground border-transparent",
          )}
        >
          {isSaving
            ? "Guardando..."
            : isPast
              ? "🔒 Cerrado"
              : saved
                ? "✓ Guardado"
                : "Guardar Prediccion"}
        </button>
      </CardContent>
    </Card>
  );
}
