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
  isCurrentUser: boolean;
  predictions: {
    matchId: string;
    phase: string | null;
    points: number;
    homeScore: number;
    awayScore: number;
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
          0
        );

        // Separar predicciones con puntos de las que no
        const scoredPredictions = filteredPredictions.filter(
          (p) => p.points > 0
        );
        const unscoredPredictions = filteredPredictions.filter(
          (p) => p.points === 0
        );

        return {
          ...user,
          points: totalPoints,
          predictionsCount: filteredPredictions.length,
          scoredPredictions,
          unscoredPredictions,
          filteredPredictions,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [users, selectedPhase]);

  return (
    <div className="space-y-6">
      {/* Phase Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filtrar por fase:</label>
        <Select value={selectedPhase} onValueChange={setSelectedPhase}>
          <SelectTrigger className="w-[250px]">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Clasificación General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16 text-center">Pos</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-center hidden md:table-cell">
                  Predicciones
                </TableHead>
                <TableHead className="text-center">Puntos</TableHead>
                <TableHead className="text-center hidden md:table-cell">
                  Promedio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((user, index) => {
                const position = index + 1;
                const avgPoints =
                  user.predictionsCount > 0
                    ? (user.points / user.predictionsCount).toFixed(2)
                    : "0.00";
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
                          ? "bg-primary/10 ring-2 ring-primary font-semibold"
                          : positionColor
                      } cursor-pointer hover:bg-muted/50 transition-colors`}
                      onClick={() => toggleUserExpand(user.id)}
                    >
                      {/* Botón Expand/Collapse */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>

                      {/* Posición */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {positionIcon || (
                            <span className="text-lg font-bold text-muted-foreground">
                              {position}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Participante */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold">
                              {user.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate">{user.name}</span>
                              {user.isCurrentUser && (
                                <Badge variant="default" className="text-xs">
                                  Tú
                                </Badge>
                              )}
                            </div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground truncate hidden md:block">
                                {user.email}
                              </div>
                            )}
                            {/* Info mobile */}
                            <div className="text-xs text-muted-foreground md:hidden mt-1">
                              {user.predictionsCount} predicciones • Promedio:{" "}
                              {avgPoints}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Predicciones (hidden on mobile) */}
                      <TableCell className="text-center hidden md:table-cell">
                        <Badge variant="outline">{user.predictionsCount}</Badge>
                      </TableCell>

                      {/* Puntos */}
                      <TableCell className="text-center">
                        <span className="text-lg font-bold text-primary">
                          {user.points}
                        </span>
                      </TableCell>

                      {/* Promedio (hidden on mobile) */}
                      <TableCell className="text-center text-muted-foreground hidden md:table-cell">
                        {avgPoints}
                      </TableCell>
                    </TableRow>

                    {/* Fila expandida con detalles */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-4">
                            {/* Estadísticas resumidas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-2xl font-bold text-primary">
                                  {user.points}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Puntos Totales
                                </p>
                              </div>
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-2xl font-bold text-green-600">
                                  {user.scoredPredictions.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Acertadas
                                </p>
                              </div>
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-2xl font-bold text-red-600">
                                  {user.unscoredPredictions.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Falladas
                                </p>
                              </div>
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">
                                  {avgPoints}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Promedio
                                </p>
                              </div>
                            </div>

                            {/* Lista de predicciones con puntos */}
                            {user.scoredPredictions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-green-600" />
                                  Predicciones Acertadas (
                                  {user.scoredPredictions.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                  {user.scoredPredictions
                                    .sort((a, b) => b.points - a.points)
                                    .map((pred, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-background rounded border border-green-200 dark:border-green-800"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            {pred.matchId.replace("match_", "#")}
                                          </span>
                                          <span className="text-sm font-mono">
                                            {pred.homeScore}-{pred.awayScore}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="default"
                                          className="bg-green-600"
                                        >
                                          +{pred.points}
                                        </Badge>
                                      </div>
                                    ))}
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                  {user.unscoredPredictions.map((pred, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 bg-background rounded border border-red-200 dark:border-red-800"
                                    >
                                      <span className="text-xs text-muted-foreground">
                                        {pred.matchId.replace("match_", "#")}
                                      </span>
                                      <span className="text-sm font-mono text-muted-foreground">
                                        {pred.homeScore}-{pred.awayScore}
                                      </span>
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

      {/* Resumen de tu posición si no estás en el top 3 */}
      {leaderboard.findIndex((u) => u.isCurrentUser) > 2 && (
        <Card className="border-primary">
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
                      1
                  )}{" "}
                  puntos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
