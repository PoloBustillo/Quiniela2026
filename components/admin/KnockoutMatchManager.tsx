"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MatchesGridSkeleton } from "@/components/ui/skeletons";
import { Trophy, Calendar, Save, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface Team {
  id: string;
  name: string;
  code: string;
  flag: string | null;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  stadium: string | null;
  city: string | null;
  phase: string;
  status: string;
}

const PHASES = [
  { value: "ROUND_OF_32", label: "32avos de Final" },
  { value: "ROUND_OF_16", label: "16avos de Final" },
  { value: "QUARTER_FINAL", label: "Cuartos de Final" },
  { value: "SEMI_FINAL", label: "Semifinales" },
  { value: "THIRD_PLACE", label: "Tercer Lugar" },
  { value: "FINAL", label: "Final" },
];

export function KnockoutMatchManager() {
  const [selectedPhase, setSelectedPhase] = useState("ROUND_OF_16");
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase]);

  const loadTeams = async () => {
    try {
      const response = await fetch("/api/admin/teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/matches?phase=${selectedPhase}`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMatch = async (
    matchId: string,
    homeTeamId: string,
    awayTeamId: string,
  ) => {
    try {
      const response = await fetch("/api/admin/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          homeTeamId,
          awayTeamId,
        }),
      });

      if (response.ok) {
        loadMatches();
        setEditingMatch(null);
      }
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  const createMatch = async () => {
    try {
      // Crear un equipo TBD temporal si no existe
      const tbdTeam = teams.find((t) => t.code === "TBD");
      if (!tbdTeam) {
        alert("Necesitas crear un equipo TBD primero");
        return;
      }

      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamId: tbdTeam.id,
          awayTeamId: tbdTeam.id,
          matchDate: new Date().toISOString(),
          stadium: "Por definir",
          city: "Por definir",
          phase: selectedPhase,
        }),
      });

      if (response.ok) {
        loadMatches();
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const updateResult = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) => {
    try {
      const response = await fetch("/api/admin/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          homeScore,
          awayScore,
          status: "FINISHED",
        }),
      });

      if (response.ok) {
        loadMatches();
      }
    } catch (error) {
      console.error("Error updating result:", error);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm("¿Estás seguro de eliminar este partido?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/matches?id=${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadMatches();
      }
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Fases Eliminatorias
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona equipos y resultados de las fases eliminatorias
          </p>
        </div>

        <Select value={selectedPhase} onValueChange={setSelectedPhase}>
          <SelectTrigger className="w-[200px]">
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

      <Button
        onClick={createMatch}
        size="lg"
        className="w-full sm:w-auto touch-manipulation active:scale-95 transition-transform"
      >
        <Plus className="h-5 w-5 mr-2" />
        Agregar Nuevo Partido
      </Button>

      {loading ? (
        <MatchesGridSkeleton count={4} />
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay partidos en esta fase. Haz clic en &quot;Agregar
              Partido&quot; para crear uno.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <Card key={match.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Header compacto */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {PHASES.find((p) => p.value === match.phase)?.label}
                    </Badge>
                    <Badge
                      variant={
                        match.status === "FINISHED" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {match.status === "FINISHED"
                        ? "✓ Finalizado"
                        : "Pendiente"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMatch(match.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Equipos y resultado en una fila */}
                <div className="flex items-center gap-3">
                  {/* Equipo Local */}
                  <div className="flex-1">
                    <Select
                      value={match.homeTeam.id}
                      onValueChange={(value) =>
                        updateMatch(match.id, value, match.awayTeam.id)
                      }
                      disabled={match.status === "FINISHED"}
                    >
                      <SelectTrigger className="h-11 touch-manipulation">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {match.homeTeam.flag && (
                              <Image
                                src={match.homeTeam.flag}
                                alt={match.homeTeam.name}
                                width={24}
                                height={18}
                                className="object-cover rounded"
                              />
                            )}
                            <span className="truncate">
                              {match.homeTeam.name}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {team.flag && (
                                <Image
                                  src={team.flag}
                                  alt={team.name}
                                  width={20}
                                  height={15}
                                  className="object-cover"
                                />
                              )}
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Equipo Visitante */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Equipo Visitante
                    </label>
                    <Select
                      value={match.awayTeam.id}
                      onValueChange={(value) =>
                        updateMatch(match.id, match.homeTeam.id, value)
                      }
                      disabled={match.status === "FINISHED"}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {match.awayTeam.flag && (
                              <Image
                                src={match.awayTeam.flag}
                                alt={match.awayTeam.name}
                                width={20}
                                height={15}
                                className="object-cover"
                              />
                            )}
                            <span>{match.awayTeam.name}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {team.flag && (
                                <Image
                                  src={team.flag}
                                  alt={team.name}
                                  width={24}
                                  height={18}
                                  className="object-cover rounded"
                                />
                              )}
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Marcadores */}
                  {match.homeTeam.code !== "TBD" &&
                    match.awayTeam.code !== "TBD" && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          value={match.homeScore ?? ""}
                          onChange={(e) => {
                            const homeScore = parseInt(e.target.value) || 0;
                            if (match.awayScore !== null) {
                              updateResult(
                                match.id,
                                homeScore,
                                match.awayScore,
                              );
                            }
                          }}
                          className="w-16 h-11 text-center text-xl font-bold touch-manipulation"
                          disabled={match.status === "FINISHED"}
                        />
                        <span className="text-xl font-bold text-muted-foreground">
                          -
                        </span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          value={match.awayScore ?? ""}
                          onChange={(e) => {
                            const awayScore = parseInt(e.target.value) || 0;
                            if (match.homeScore !== null) {
                              updateResult(
                                match.id,
                                match.homeScore,
                                awayScore,
                              );
                            }
                          }}
                          className="w-16 h-11 text-center text-xl font-bold touch-manipulation"
                          disabled={match.status === "FINISHED"}
                        />
                      </div>
                    )}

                  {/* Equipo Visitante */}
                  <div className="flex-1">
                    <Select
                      value={match.awayTeam.id}
                      onValueChange={(value) =>
                        updateMatch(match.id, match.homeTeam.id, value)
                      }
                      disabled={match.status === "FINISHED"}
                    >
                      <SelectTrigger className="h-11 touch-manipulation">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {match.awayTeam.flag && (
                              <Image
                                src={match.awayTeam.flag}
                                alt={match.awayTeam.name}
                                width={24}
                                height={18}
                                className="object-cover rounded"
                              />
                            )}
                            <span className="truncate">
                              {match.awayTeam.name}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {team.flag && (
                                <Image
                                  src={team.flag}
                                  alt={team.name}
                                  width={24}
                                  height={18}
                                  className="object-cover rounded"
                                />
                              )}
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(match.matchDate).toLocaleDateString("es-MX", {
                      dateStyle: "medium",
                    })}
                  </div>
                  {match.stadium && <span>📍 {match.stadium}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
