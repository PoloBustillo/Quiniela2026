"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

interface UserWithPoints {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  hasPaid: boolean;
  isCurrentUser: boolean;
  predictions: {
    matchId: string;
    phase: string | null;
    points: number;
    homeScore: number;
    awayScore: number;
    match?: {
      homeTeam: { name: string; code: string; flag: string | null };
      awayTeam: { name: string; code: string; flag: string | null };
      homeScore: number | null;
      awayScore: number | null;
    };
  }[];
}

interface LeaderboardByPhaseProps {
  users: UserWithPoints[];
}

const PHASES = [
  { value: "ALL", label: "Todos los Puntos" },
  { value: "GROUP_STAGE", label: "Fase de Grupos" },
  { value: "ROUND_OF_32", label: "32avos de Final" },
  { value: "ROUND_OF_16", label: "16avos de Final" },
  { value: "QUARTER_FINAL", label: "Cuartos de Final" },
  { value: "SEMI_FINAL", label: "Semifinales" },
  { value: "THIRD_PLACE", label: "Tercer Lugar" },
  { value: "FINAL", label: "Final" },
];

export default function LeaderboardByPhase({ users }: LeaderboardByPhaseProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>("ALL");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const leaderboard = useMemo(() => {
    return users
      .map((user) => {
        const filteredPredictions =
          selectedPhase === "ALL"
            ? user.predictions
            : user.predictions.filter((p) => p.phase === selectedPhase);

        const totalPoints = filteredPredictions.reduce(
          (sum, pred) => sum + pred.points,
          0,
        );

        // Separar predicciones con puntos de las que no
        const scoredPredictions = filteredPredictions.filter(
          (p) => p.points > 0,
        );
        const unscoredPredictions = filteredPredictions.filter(
          (p) => p.points === 0,
        );

        // Calcular estadísticas para badges
        // 1. Racha actual (predicciones consecutivas con puntos)
        let currentStreak = 0;
        for (let i = filteredPredictions.length - 1; i >= 0; i--) {
          if (filteredPredictions[i].points > 0) {
            currentStreak++;
          } else {
            break;
          }
        }

        // 2. Efectividad (% de aciertos)
        const effectiveness =
          filteredPredictions.length > 0
            ? (scoredPredictions.length / filteredPredictions.length) * 100
            : 0;

        // 3. Predicciones exactas (asumiendo que el máximo de puntos es 5)
        const exactPredictions = filteredPredictions.filter(
          (p) => p.points === 5,
        ).length;

        // Determinar badges
        const badges = [];

        if (currentStreak >= 3) {
          badges.push({
            icon: "🔥",
            label: "En racha",
            variant: "destructive" as const,
          });
        }

        if (effectiveness >= 80 && filteredPredictions.length >= 5) {
          badges.push({
            icon: "⭐",
            label: "Experto",
            variant: "default" as const,
          });
        }

        if (exactPredictions >= 3) {
          badges.push({
            icon: "🎯",
            label: "Preciso",
            variant: "secondary" as const,
          });
        }

        return {
          ...user,
          points: totalPoints,
          predictionsCount: filteredPredictions.length,
          scoredPredictions,
          unscoredPredictions,
          filteredPredictions,
          currentStreak,
          effectiveness,
          exactPredictions,
          badges,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [users, selectedPhase]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Phase Selector */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
        <label className="text-xs sm:text-sm font-medium">
          Filtrar por fase:
        </label>
        <Select value={selectedPhase} onValueChange={setSelectedPhase}>
          <SelectTrigger className="w-full xs:w-[200px] sm:w-[250px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHASES.map((phase) => (
              <SelectItem key={phase.value} value={phase.value}>
                {phase.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla completa de posiciones */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Clasificación General
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 sm:w-12 px-1 sm:px-4"></TableHead>
                <TableHead className="w-12 sm:w-16 text-center px-1 sm:px-4 text-xs sm:text-sm">
                  Pos
                </TableHead>
                <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">
                  Participante
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell px-2 sm:px-4 text-xs sm:text-sm">
                  Predicciones
                </TableHead>
                <TableHead className="text-center px-2 sm:px-4 text-xs sm:text-sm">
                  Puntos
                </TableHead>
                <TableHead className="text-center hidden lg:table-cell px-2 sm:px-4 text-xs sm:text-sm">
                  Aciertos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((user, index) => {
                const position = index + 1;
                const aciertos = user.scoredPredictions.length;
                const isExpanded = expandedUsers.has(user.id);

                let positionIcon = null;
                let positionColor = "";

                if (position === 1) {
                  positionIcon = <Trophy className="h-5 w-5 text-yellow-500" />;
                  positionColor = "bg-yellow-50 dark:bg-yellow-950/20";
                } else if (position === 2) {
                  positionIcon = <Medal className="h-5 w-5 text-gray-400" />;
                  positionColor = "bg-gray-50 dark:bg-gray-950/20";
                } else if (position === 3) {
                  positionIcon = <Award className="h-5 w-5 text-amber-600" />;
                  positionColor = "bg-amber-50 dark:bg-amber-950/20";
                }

                return (
                  <>
                    {/* Fila principal */}
                    <TableRow
                      key={user.id}
                      className={`${
                        user.isCurrentUser
                          ? "bg-primary/10 border-l-4 border-primary font-semibold shadow-sm"
                          : positionColor
                      } cursor-pointer hover:bg-muted/50 transition-all touch-manipulation active:scale-[0.99]`}
                      onClick={() => toggleUserExpand(user.id)}
                    >
                      {/* Botón Expand/Collapse */}
                      <TableCell className="text-center px-1 sm:px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </TableCell>

                      {/* Posición */}
                      <TableCell className="text-center px-1 sm:px-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {positionIcon || (
                            <span className="text-base sm:text-lg font-bold text-muted-foreground">
                              {position}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Participante */}
                      <TableCell className="px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                              {user.name[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <span className="truncate text-xs sm:text-sm md:text-base">
                                {user.name}
                              </span>
                              {user.isCurrentUser && (
                                <Badge variant="default" className="text-xs">
                                  Tú
                                </Badge>
                              )}
                              {!user.hasPaid && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  No pagado
                                </Badge>
                              )}
                              {/* Badges especiales */}
                              {user.badges.map((badge, idx) => (
                                <Badge
                                  key={idx}
                                  variant={badge.variant}
                                  className="text-xs hidden md:inline-flex"
                                >
                                  {badge.icon} {badge.label}
                                </Badge>
                              ))}
                            </div>
                            {/* Badges en mobile - solo iconos */}
                            {user.badges.length > 0 && (
                              <div className="flex gap-1 mt-1 md:hidden">
                                {user.badges.map((badge, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm"
                                    title={badge.label}
                                  >
                                    {badge.icon}
                                  </span>
                                ))}
                              </div>
                            )}
                            {user.email && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden md:block">
                                {user.email}
                              </div>
                            )}
                            {/* Info mobile */}
                            <div className="text-[10px] sm:text-xs text-muted-foreground sm:hidden mt-0.5">
                              {user.predictionsCount} predicciones • {aciertos}{" "}
                              aciertos
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Predicciones (hidden on small mobile) */}
                      <TableCell className="text-center hidden sm:table-cell px-2 sm:px-4">
                        <Badge variant="outline" className="text-xs">
                          {user.predictionsCount}
                        </Badge>
                      </TableCell>

                      {/* Puntos */}
                      <TableCell className="text-center px-2 sm:px-4">
                        <span className="text-base sm:text-lg font-bold text-primary">
                          {user.points}
                        </span>
                      </TableCell>

                      {/* Aciertos (hidden on mobile) */}
                      <TableCell className="text-center hidden lg:table-cell px-2 sm:px-4">
                        <Badge variant="secondary" className="text-xs">
                          {aciertos} / {user.predictionsCount}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Fila expandida con detalles */}
                    {isExpanded && (
                      <TableRow key={`${user.id}-details`}>
                        <TableCell
                          colSpan={6}
                          className="bg-muted/30 p-3 sm:p-4"
                        >
                          <div className="space-y-3 sm:space-y-4">
                            {/* Estadísticas resumidas */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                              <div className="text-center p-2 sm:p-3 bg-background rounded-lg">
                                <p className="text-xl sm:text-2xl font-bold text-primary">
                                  {user.points}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Puntos
                                </p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-background rounded-lg">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">
                                  {user.scoredPredictions.length}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Aciertos
                                </p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-background rounded-lg">
                                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                                  {user.effectiveness.toFixed(0)}%
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Efectividad
                                </p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-background rounded-lg">
                                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                  {user.exactPredictions}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Exactos
                                </p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-background rounded-lg">
                                <p className="text-xl sm:text-2xl font-bold text-red-600">
                                  {user.currentStreak}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Racha
                                </p>
                              </div>
                            </div>

                            {/* Badges explicados */}
                            {user.badges.length > 0 && (
                              <div className="bg-background rounded-lg p-3">
                                <p className="text-xs font-semibold mb-2">
                                  Logros Desbloqueados:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {user.badges.map((badge, idx) => (
                                    <Badge
                                      key={idx}
                                      variant={badge.variant}
                                      className="text-xs"
                                    >
                                      {badge.icon} {badge.label}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lista de predicciones con puntos */}
                            {user.scoredPredictions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                                  Predicciones Acertadas (
                                  {user.scoredPredictions.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                                  {user.scoredPredictions
                                    .sort((a, b) => b.points - a.points)
                                    .map((pred, idx) => {
                                      const isExact = pred.points === 5;
                                      return (
                                        <div
                                          key={idx}
                                          className={`flex flex-col items-center gap-1 p-2 bg-background rounded-lg border-2 shadow-sm ${
                                            isExact
                                              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                                              : "border-green-500"
                                          }`}
                                        >
                                          {/* Banderas como avatares */}
                                          <div className="flex items-center gap-1">
                                            <Image
                                              src={
                                                pred.match?.homeTeam?.flag ||
                                                "/flags/tbd.png"
                                              }
                                              alt={
                                                pred.match?.homeTeam?.code || ""
                                              }
                                              width={24}
                                              height={24}
                                              className="rounded-sm border border-gray-300"
                                            />
                                            <Image
                                              src={
                                                pred.match?.awayTeam?.flag ||
                                                "/flags/tbd.png"
                                              }
                                              alt={
                                                pred.match?.awayTeam?.code || ""
                                              }
                                              width={24}
                                              height={24}
                                              className="rounded-sm border border-gray-300"
                                            />
                                          </div>
                                          {/* Marcador predicción */}
                                          <div className="text-xs font-bold text-center">
                                            {pred.homeScore}-{pred.awayScore}
                                          </div>
                                          {/* Marcador real */}
                                          {pred.match?.homeScore !== null &&
                                            pred.match?.homeScore !==
                                              undefined && (
                                              <div className="text-[10px] text-muted-foreground text-center">
                                                Real: {pred.match.homeScore}-
                                                {pred.match.awayScore}
                                              </div>
                                            )}
                                          {/* Puntos */}
                                          <Badge
                                            variant="default"
                                            className={`text-[10px] px-1 py-0 ${
                                              isExact
                                                ? "bg-yellow-600 hover:bg-yellow-700"
                                                : "bg-green-600"
                                            }`}
                                          >
                                            {isExact ? "⭐" : "+"}
                                            {pred.points}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Lista de predicciones sin puntos */}
                            {user.unscoredPredictions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Minus className="h-4 w-4 text-red-600" />
                                  Predicciones Falladas (
                                  {user.unscoredPredictions.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                                  {user.unscoredPredictions.map((pred, idx) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col items-center gap-1 p-2 bg-background rounded-lg border-2 border-red-500 shadow-sm"
                                    >
                                      {/* Banderas como avatares */}
                                      <div className="flex items-center gap-1">
                                        <Image
                                          src={
                                            pred.match?.homeTeam?.flag ||
                                            "/flags/tbd.png"
                                          }
                                          alt={pred.match?.homeTeam?.code || ""}
                                          width={24}
                                          height={24}
                                          className="rounded-sm border border-gray-300"
                                        />
                                        <Image
                                          src={
                                            pred.match?.awayTeam?.flag ||
                                            "/flags/tbd.png"
                                          }
                                          alt={pred.match?.awayTeam?.code || ""}
                                          width={24}
                                          height={24}
                                          className="rounded-sm border border-gray-300"
                                        />
                                      </div>
                                      {/* Marcador predicción */}
                                      <div className="text-xs font-mono text-muted-foreground text-center">
                                        {pred.homeScore}-{pred.awayScore}
                                      </div>
                                      {/* Marcador real */}
                                      {pred.match?.homeScore !== null &&
                                        pred.match?.homeScore !== undefined && (
                                          <div className="text-[10px] text-red-600 font-bold text-center">
                                            Real: {pred.match.homeScore}-
                                            {pred.match.awayScore}
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumen de tu posición - Desktop (si no estás en el top 3) */}
      {leaderboard.findIndex((u) => u.isCurrentUser) > 2 && (
        <Card className="border-primary hidden md:block">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  #{leaderboard.findIndex((u) => u.isCurrentUser) + 1}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tu posición actual
                  </p>
                  <p className="font-semibold">
                    {leaderboard.find((u) => u.isCurrentUser)?.points || 0}{" "}
                    puntos totales
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Para alcanzar el podio necesitas
                </p>
                <p className="text-2xl font-bold text-primary">
                  {Math.max(
                    0,
                    (leaderboard[2]?.points || 0) -
                      (leaderboard.find((u) => u.isCurrentUser)?.points || 0) +
                      1,
                  )}{" "}
                  puntos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky Footer - Mobile: Tu posición actual */}
      {(() => {
        const currentUserIndex = leaderboard.findIndex((u) => u.isCurrentUser);
        const currentUser = leaderboard[currentUserIndex];
        if (!currentUser) return null;

        const position = currentUserIndex + 1;
        const pointsToTop3 = Math.max(
          0,
          (leaderboard[2]?.points || 0) - currentUser.points + 1,
        );

        let positionIcon = null;
        if (position === 1)
          positionIcon = <Trophy className="h-5 w-5 text-yellow-500" />;
        else if (position === 2)
          positionIcon = <Medal className="h-5 w-5 text-gray-400" />;
        else if (position === 3)
          positionIcon = <Award className="h-5 w-5 text-amber-600" />;

        return (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t-4 border-primary shadow-2xl backdrop-blur-sm bg-card/95">
            <div className="container mx-auto px-4 py-3 max-w-7xl">
              <div className="flex items-center justify-between gap-3">
                {/* Posición */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary">
                    {positionIcon || (
                      <span className="text-xl font-bold text-primary">
                        {position}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tu posición</p>
                    <p className="text-sm font-semibold">{currentUser.name}</p>
                  </div>
                </div>

                {/* Puntos */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Puntos</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentUser.points}
                  </p>
                </div>

                {/* Indicador de distancia al podio */}
                {position > 3 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Al podio</p>
                    <p className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {pointsToTop3}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
