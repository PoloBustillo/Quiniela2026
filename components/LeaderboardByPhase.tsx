"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
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
    phase: string | null;
    points: number;
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

        return {
          ...user,
          points: totalPoints,
          predictionsCount: filteredPredictions.length,
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
                <TableHead className="w-16 text-center">Pos</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-center">Predicciones</TableHead>
                <TableHead className="text-center">Puntos</TableHead>
                <TableHead className="text-center">Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((user, index) => {
                const position = index + 1;
                const avgPoints =
                  user.predictionsCount > 0
                    ? (user.points / user.predictionsCount).toFixed(2)
                    : "0.00";

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
                  <TableRow
                    key={user.id}
                    className={`${
                      user.isCurrentUser
                        ? "bg-primary/10 ring-2 ring-primary font-semibold"
                        : positionColor
                    }`}
                  >
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {positionIcon || (
                          <span className="text-lg font-bold text-muted-foreground">
                            {position}
                          </span>
                        )}
                      </div>
                    </TableCell>
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
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.isCurrentUser && (
                              <Badge variant="default" className="text-xs">
                                Tú
                              </Badge>
                            )}
                          </div>
                          {user.email && (
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{user.predictionsCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold text-primary">
                        {user.points}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {avgPoints}
                    </TableCell>
                  </TableRow>
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
