"use client";

import { useState, useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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

      {leaderboard.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <div className="text-7xl mb-4">📊</div>
            <CardTitle className="text-2xl md:text-3xl">
              No hay predicciones para esta fase
            </CardTitle>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid md:grid-cols-3 gap-4">
            {top3.map((user, index) => {
              const icons = [
                <Trophy key="trophy" className="h-6 w-6 text-yellow-500" />,
                <Medal key="medal" className="h-6 w-6 text-gray-400" />,
                <Award key="award" className="h-6 w-6 text-amber-600" />,
              ];

              return (
                <Card
                  key={user.id}
                  className={`${
                    user.isCurrentUser
                      ? "ring-2 ring-primary animate-pulse-subtle"
                      : ""
                  }`}
                >
                  <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">{icons[index]}</div>
                    <div className="space-y-2">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={80}
                          height={80}
                          className="rounded-full mx-auto"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center text-2xl font-bold">
                          {user.name[0]}
                        </div>
                      )}
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      {user.isCurrentUser && (
                        <Badge variant="default">Tú</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {user.points}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.predictionsCount} predicciones
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Rest of the leaderboard */}
          {rest.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resto de Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rest.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        user.isCurrentUser ? "bg-primary/5 ring-2 ring-primary" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-muted-foreground w-8">
                          {index + 4}
                        </div>
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-lg font-bold">
                            {user.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {user.name}
                            {user.isCurrentUser && (
                              <Badge variant="default">Tú</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.predictionsCount} predicciones
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{user.points}</div>
                        <div className="text-sm text-muted-foreground">puntos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
