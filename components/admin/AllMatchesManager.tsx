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
import { Trophy, Calendar, Save, Plus, Trash2, Edit2 } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointsRulesManager } from "./PointsRulesManager";
import { UsersPaymentManager } from "./UsersPaymentManager";

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

interface JsonMatch {
  id: number;
  homeTeam: { name: string; code: string; flag: string };
  awayTeam: { name: string; code: string; flag: string };
  date: string;
  stadium: string;
  city: string;
  group: string;
}

const PHASES = [
  { value: "GROUP_STAGE", label: "Fase de Grupos" },
  { value: "ROUND_OF_32", label: "32avos de Final" },
  { value: "ROUND_OF_16", label: "16avos de Final" },
  { value: "QUARTER_FINAL", label: "Cuartos de Final" },
  { value: "SEMI_FINAL", label: "Semifinales" },
  { value: "THIRD_PLACE", label: "Tercer Lugar" },
  { value: "FINAL", label: "Final" },
];

export function AllMatchesManager() {
  const [selectedTab, setSelectedTab] = useState<"knockout" | "group" | "rules" | "users">("knockout");
  const [selectedPhase, setSelectedPhase] = useState("ROUND_OF_16");
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupMatches, setGroupMatches] = useState<JsonMatch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editingScores, setEditingScores] = useState<{
    [key: string]: { homeScore: number | null; awayScore: number | null };
  }>({});

  useEffect(() => {
    loadTeams();
    if (selectedTab === "knockout") {
      loadKnockoutMatches();
    } else {
      loadGroupMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase, selectedTab]);

  const loadTeams = async () => {
    try {
      const response = await fetch("/api/admin/teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const loadKnockoutMatches = async () => {
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

  const loadGroupMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/group-matches");
      const data = await response.json();
      setGroupMatches(data);
    } catch (error) {
      console.error("Error loading group matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateKnockoutMatch = async (
    matchId: string,
    updates: {
      homeTeamId?: string;
      awayTeamId?: string;
      homeScore?: number | null;
      awayScore?: number | null;
      matchDate?: string;
      stadium?: string;
      city?: string;
      status?: string;
    }
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          ...updates,
        }),
      });

      if (response.ok) {
        await loadKnockoutMatches();
        setEditingMatch(null);
        setEditingScores(prev => {
          const newScores = { ...prev };
          delete newScores[matchId];
          return newScores;
        });
        alert("✅ Partido actualizado correctamente");
      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (error) {
      console.error("Error updating match:", error);
      alert("❌ Error al actualizar el partido");
    } finally {
      setLoading(false);
    }
  };

  const updateGroupMatch = async (
    matchId: number,
    updates: {
      homeScore?: number;
      awayScore?: number;
      matchDate?: string;
    }
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/group-matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          ...updates,
        }),
      });

      if (response.ok) {
        await loadGroupMatches();
        setEditingMatch(null);
        setEditingScores(prev => {
          const newScores = { ...prev };
          delete newScores[String(matchId)];
          return newScores;
        });
        alert("✅ Partido actualizado correctamente");
      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (error) {
      console.error("Error updating group match:", error);
      alert("❌ Error al actualizar el partido");
    } finally {
      setLoading(false);
    }
  };

  const createKnockoutMatch = async () => {
    try {
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
        loadKnockoutMatches();
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const deleteKnockoutMatch = async (matchId: string) => {
    if (!confirm("¿Estás seguro de eliminar este partido?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/matches?id=${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadKnockoutMatches();
      }
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "knockout" | "group")}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="knockout">Eliminatorias</TabsTrigger>
          <TabsTrigger value="group">Grupos</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="knockout" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Partidos Eliminatorios</h2>
              <p className="text-muted-foreground">
                Selecciona equipos, cambia fechas y escribe marcadores. Presiona el botón "Guardar" para aplicar cambios.
              </p>
            </div>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.filter((p) => p.value !== "GROUP_STAGE").map((phase) => (
                  <SelectItem key={phase.value} value={phase.value}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={createKnockoutMatch} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Partido
          </Button>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando partidos...</p>
            </div>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay partidos en esta fase. Haz clic en &quot;Agregar Partido&quot; para crear uno.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {PHASES.find((p) => p.value === match.phase)?.label}
                        </CardTitle>
                        <Badge
                          variant={match.status === "FINISHED" ? "default" : "secondary"}
                        >
                          {match.status === "FINISHED" ? "Finalizado" : "Pendiente"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKnockoutMatch(match.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.matchDate).toLocaleDateString("es-MX", {
                        dateStyle: "full",
                      })}
                      {match.stadium && ` • ${match.stadium}`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Equipos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Equipo Local</label>
                        <Select
                          value={match.homeTeam.id}
                          onValueChange={(value) =>
                            updateKnockoutMatch(match.id, {
                              homeTeamId: value,
                            })
                          }
                          disabled={match.status === "FINISHED"}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                {match.homeTeam.flag && (
                                  <Image
                                    src={match.homeTeam.flag}
                                    alt={match.homeTeam.name}
                                    width={20}
                                    height={15}
                                    className="object-cover"
                                  />
                                )}
                                <span>{match.homeTeam.name}</span>
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Equipo Visitante</label>
                        <Select
                          value={match.awayTeam.id}
                          onValueChange={(value) =>
                            updateKnockoutMatch(match.id, {
                              awayTeamId: value,
                            })
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
                    </div>

                    {/* Fecha, Estadio y Ciudad */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha y Hora</label>
                        <Input
                          type="datetime-local"
                          value={new Date(match.matchDate).toISOString().slice(0, 16)}
                          onChange={(e) =>
                            updateKnockoutMatch(match.id, {
                              matchDate: new Date(e.target.value).toISOString(),
                            })
                          }
                          disabled={match.status === "FINISHED"}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estadio</label>
                        <Input
                          type="text"
                          placeholder="Nombre del estadio"
                          defaultValue={match.stadium || ""}
                          onBlur={(e) => {
                            if (e.target.value !== match.stadium) {
                              updateKnockoutMatch(match.id, {
                                stadium: e.target.value,
                              });
                            }
                          }}
                          disabled={match.status === "FINISHED"}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ciudad</label>
                        <Input
                          type="text"
                          placeholder="Ciudad"
                          defaultValue={match.city || ""}
                          onBlur={(e) => {
                            if (e.target.value !== match.city) {
                              updateKnockoutMatch(match.id, {
                                city: e.target.value,
                              });
                            }
                          }}
                          disabled={match.status === "FINISHED"}
                        />
                      </div>
                    </div>

                    {/* Marcadores */}
                    {match.homeTeam.code !== "TBD" && match.awayTeam.code !== "TBD" && (
                      <div className="border-t pt-4">
                        <label className="text-sm font-medium mb-2 block">
                          Resultado Final
                        </label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={
                              editingScores[match.id]?.homeScore !== undefined
                                ? editingScores[match.id].homeScore ?? ""
                                : match.homeScore ?? ""
                            }
                            onChange={(e) => {
                              const homeScore = e.target.value === "" ? null : parseInt(e.target.value);
                              setEditingScores(prev => ({
                                ...prev,
                                [match.id]: {
                                  homeScore,
                                  awayScore: prev[match.id]?.awayScore !== undefined 
                                    ? prev[match.id].awayScore 
                                    : match.awayScore
                                }
                              }));
                            }}
                            className="w-20 text-center"
                          />
                          <span className="text-2xl font-bold">-</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={
                              editingScores[match.id]?.awayScore !== undefined
                                ? editingScores[match.id].awayScore ?? ""
                                : match.awayScore ?? ""
                            }
                            onChange={(e) => {
                              const awayScore = e.target.value === "" ? null : parseInt(e.target.value);
                              setEditingScores(prev => ({
                                ...prev,
                                [match.id]: {
                                  homeScore: prev[match.id]?.homeScore !== undefined 
                                    ? prev[match.id].homeScore 
                                    : match.homeScore,
                                  awayScore
                                }
                              }));
                            }}
                            className="w-20 text-center"
                          />
                        </div>
                        {editingScores[match.id] && (
                          <Button
                            onClick={() => {
                              updateKnockoutMatch(match.id, {
                                homeScore: editingScores[match.id].homeScore,
                                awayScore: editingScores[match.id].awayScore,
                                status: "FINISHED",
                              });
                            }}
                            disabled={loading}
                            className="mt-2 w-full"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Guardando..." : "Guardar Marcadores"}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="group" className="space-y-4 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Partidos de Fase de Grupos</h2>
            <p className="text-muted-foreground">
              Escribe los marcadores y presiona "Guardar Marcadores" para actualizar cada partido. También puedes cambiar las fechas.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando partidos...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {groupMatches.map((match) => (
                <Card key={match.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Grupo {match.group}</CardTitle>
                      <Badge variant="secondary">Partido {match.id}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.date).toLocaleDateString("es-MX", {
                        dateStyle: "full",
                      })}
                      {match.stadium && ` • ${match.stadium}`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fecha */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha y Hora</label>
                        <Input
                          type="datetime-local"
                          value={new Date(match.date).toISOString().slice(0, 16)}
                          onChange={(e) =>
                            updateGroupMatch(match.id, {
                              matchDate: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      </div>

                      {/* Equipos Display */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Equipos</label>
                        <div className="flex items-center justify-around p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Image
                              src={match.homeTeam.flag}
                              alt={match.homeTeam.name}
                              width={24}
                              height={18}
                              className="object-cover"
                            />
                            <span className="text-sm">{match.homeTeam.name}</span>
                          </div>
                          <span className="text-muted-foreground">VS</span>
                          <div className="flex items-center gap-2">
                            <Image
                              src={match.awayTeam.flag}
                              alt={match.awayTeam.name}
                              width={24}
                              height={18}
                              className="object-cover"
                            />
                            <span className="text-sm">{match.awayTeam.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marcadores */}
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium mb-2 block">
                        Resultado Final
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={
                            editingScores[match.id]?.homeScore !== undefined
                              ? editingScores[match.id].homeScore ?? ""
                              : ""
                          }
                          onChange={(e) => {
                            const homeScore = e.target.value === "" ? null : parseInt(e.target.value);
                            setEditingScores(prev => ({
                              ...prev,
                              [match.id]: {
                                homeScore,
                                awayScore: prev[match.id]?.awayScore !== undefined 
                                  ? prev[match.id].awayScore 
                                  : null
                              }
                            }));
                          }}
                          className="w-20 text-center"
                        />
                        <span className="text-2xl font-bold">-</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={
                            editingScores[match.id]?.awayScore !== undefined
                              ? editingScores[match.id].awayScore ?? ""
                              : ""
                          }
                          onChange={(e) => {
                            const awayScore = e.target.value === "" ? null : parseInt(e.target.value);
                            setEditingScores(prev => ({
                              ...prev,
                              [match.id]: {
                                homeScore: prev[match.id]?.homeScore !== undefined 
                                  ? prev[match.id].homeScore 
                                  : null,
                                awayScore
                              }
                            }));
                          }}
                          className="w-20 text-center"
                        />
                      </div>
                      {editingScores[match.id] && (
                        <Button
                          onClick={() => {
                            updateGroupMatch(match.id, {
                              homeScore: editingScores[match.id].homeScore ?? 0,
                              awayScore: editingScores[match.id].awayScore ?? 0,
                            });
                          }}
                          disabled={loading}
                          className="mt-2 w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? "Guardando..." : "Guardar Marcadores"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-6">
          <PointsRulesManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <UsersPaymentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
