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
import stadiumsData from "@/data/stadiums.json";
import { extractMexicoCityDateTime, fromMexicoCityTime } from "@/lib/points";

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
  homeScore?: number | null;
  awayScore?: number | null;
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

// Listas de estadios y ciudades disponibles
const STADIUMS = stadiumsData.stadiums.map((s) => ({
  id: s.id,
  name: s.name,
  city: s.city,
  country: s.country,
}));

const CITIES = Array.from(
  new Set(stadiumsData.stadiums.map((s) => s.city))
).sort();

export function AllMatchesManager() {
  const [selectedTab, setSelectedTab] = useState<
    "knockout" | "group" | "rules" | "users"
  >("knockout");
  const [selectedPhase, setSelectedPhase] = useState("ROUND_OF_16");
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupMatches, setGroupMatches] = useState<JsonMatch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editingScores, setEditingScores] = useState<{
    [key: string]: { homeScore: number | null; awayScore: number | null };
  }>({});

  // Estado temporal para ediciones de knockout
  const [pendingKnockoutEdits, setPendingKnockoutEdits] = useState<{
    [matchId: string]: {
      homeTeamId?: string;
      awayTeamId?: string;
      homeScore?: number | null;
      awayScore?: number | null;
      matchDate?: string;
      stadium?: string;
      city?: string;
      status?: string;
    };
  }>({});

  // Estado temporal para ediciones de grupos
  const [pendingGroupEdits, setPendingGroupEdits] = useState<{
    [matchId: number]: {
      homeScore?: number;
      awayScore?: number;
      date?: string;
      stadium?: string;
      city?: string;
    };
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

  // Actualizar estado temporal de knockout
  const updateKnockoutMatchTemp = (
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
    setPendingKnockoutEdits((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  // Guardar cambios de knockout
  const saveKnockoutMatch = async (matchId: string) => {
    const updates = pendingKnockoutEdits[matchId];
    if (!updates) {
      alert("No hay cambios pendientes");
      return;
    }

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
        setEditingScores((prev) => {
          const newScores = { ...prev };
          delete newScores[matchId];
          return newScores;
        });
        setPendingKnockoutEdits((prev) => {
          const newEdits = { ...prev };
          delete newEdits[matchId];
          return newEdits;
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

  // Cancelar cambios de knockout
  const cancelKnockoutEdit = (matchId: string) => {
    setPendingKnockoutEdits((prev) => {
      const newEdits = { ...prev };
      delete newEdits[matchId];
      return newEdits;
    });
    setEditingScores((prev) => {
      const newScores = { ...prev };
      delete newScores[matchId];
      return newScores;
    });
  };

  // Actualizar estado temporal de grupos
  const updateGroupMatchTemp = (
    matchId: number,
    updates: {
      homeScore?: number;
      awayScore?: number;
      date?: string;
      stadium?: string;
      city?: string;
    }
  ) => {
    setPendingGroupEdits((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  // Guardar cambios de grupo
  const saveGroupMatch = async (matchId: number) => {
    const updates = pendingGroupEdits[matchId];
    if (!updates) {
      alert("No hay cambios pendientes");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admin/group-matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeScore: updates.homeScore,
          awayScore: updates.awayScore,
          matchDate: updates.date,
        }),
      });

      if (response.ok) {
        await loadGroupMatches();
        setEditingMatch(null);
        setEditingScores((prev) => {
          const newScores = { ...prev };
          delete newScores[String(matchId)];
          return newScores;
        });
        setPendingGroupEdits((prev) => {
          const newEdits = { ...prev };
          delete newEdits[matchId];
          return newEdits;
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

  // Cancelar cambios de grupo
  const cancelGroupEdit = (matchId: number) => {
    setPendingGroupEdits((prev) => {
      const newEdits = { ...prev };
      delete newEdits[matchId];
      return newEdits;
    });
    setEditingScores((prev) => {
      const newScores = { ...prev };
      delete newScores[String(matchId)];
      return newScores;
    });
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
      <Tabs
        value={selectedTab}
        onValueChange={(v) => setSelectedTab(v as "knockout" | "group")}
      >
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
                Selecciona equipos, cambia fechas y escribe marcadores. Presiona
                el botón &ldquo;Guardar&rdquo; para aplicar cambios.
              </p>
            </div>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.filter((p) => p.value !== "GROUP_STAGE").map(
                  (phase) => (
                    <SelectItem key={phase.value} value={phase.value}>
                      {phase.label}
                    </SelectItem>
                  )
                )}
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
                  No hay partidos en esta fase. Haz clic en &quot;Agregar
                  Partido&quot; para crear uno.
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
                          variant={
                            match.status === "FINISHED"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {match.status === "FINISHED"
                            ? "Finalizado"
                            : "Pendiente"}
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
                        <label className="text-sm font-medium">
                          Equipo Local
                        </label>
                        <Select
                          value={
                            pendingKnockoutEdits[match.id]?.homeTeamId ||
                            match.homeTeam.id
                          }
                          onValueChange={(value) =>
                            updateKnockoutMatchTemp(match.id, {
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
                        <label className="text-sm font-medium">
                          Equipo Visitante
                        </label>
                        <Select
                          value={
                            pendingKnockoutEdits[match.id]?.awayTeamId ||
                            match.awayTeam.id
                          }
                          onValueChange={(value) =>
                            updateKnockoutMatchTemp(match.id, {
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
                        <label className="text-sm font-medium">
                          Fecha y Hora (México)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              pendingKnockoutEdits[match.id]?.matchDate
                                ? extractMexicoCityDateTime(
                                    new Date(
                                      pendingKnockoutEdits[match.id].matchDate!
                                    )
                                  ).date
                                : extractMexicoCityDateTime(
                                    new Date(match.matchDate)
                                  ).date
                            }
                            onChange={(e) => {
                              const currentTime = pendingKnockoutEdits[match.id]
                                ?.matchDate
                                ? extractMexicoCityDateTime(
                                    new Date(
                                      pendingKnockoutEdits[match.id].matchDate!
                                    )
                                  ).time
                                : extractMexicoCityDateTime(
                                    new Date(match.matchDate)
                                  ).time;
                              updateKnockoutMatchTemp(match.id, {
                                matchDate: fromMexicoCityTime(
                                  e.target.value,
                                  currentTime
                                ).toISOString(),
                              });
                            }}
                            disabled={match.status === "FINISHED"}
                          />
                          <Input
                            type="time"
                            value={
                              pendingKnockoutEdits[match.id]?.matchDate
                                ? extractMexicoCityDateTime(
                                    new Date(
                                      pendingKnockoutEdits[match.id].matchDate!
                                    )
                                  ).time
                                : extractMexicoCityDateTime(
                                    new Date(match.matchDate)
                                  ).time
                            }
                            onChange={(e) => {
                              const currentDate = pendingKnockoutEdits[match.id]
                                ?.matchDate
                                ? extractMexicoCityDateTime(
                                    new Date(
                                      pendingKnockoutEdits[match.id].matchDate!
                                    )
                                  ).date
                                : extractMexicoCityDateTime(
                                    new Date(match.matchDate)
                                  ).date;
                              updateKnockoutMatchTemp(match.id, {
                                matchDate: fromMexicoCityTime(
                                  currentDate,
                                  e.target.value
                                ).toISOString(),
                              });
                            }}
                            disabled={match.status === "FINISHED"}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estadio</label>
                        <Select
                          value={
                            pendingKnockoutEdits[match.id]?.stadium !==
                            undefined
                              ? pendingKnockoutEdits[match.id].stadium || ""
                              : match.stadium || ""
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatchTemp(match.id, {
                              stadium: value,
                            });
                          }}
                          disabled={match.status === "FINISHED"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estadio" />
                          </SelectTrigger>
                          <SelectContent>
                            {STADIUMS.map((stadium) => (
                              <SelectItem key={stadium.id} value={stadium.name}>
                                {stadium.name} ({stadium.city},{" "}
                                {stadium.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ciudad</label>
                        <Select
                          value={
                            pendingKnockoutEdits[match.id]?.city !== undefined
                              ? pendingKnockoutEdits[match.id].city || ""
                              : match.city || ""
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatchTemp(match.id, {
                              city: value,
                            });
                          }}
                          disabled={match.status === "FINISHED"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botones de Guardar/Cancelar cambios generales */}
                    {pendingKnockoutEdits[match.id] &&
                      !editingScores[match.id] && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            onClick={() => saveKnockoutMatch(match.id)}
                            disabled={loading}
                            className="flex-1"
                            variant="default"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Guardando..." : "Guardar Cambios"}
                          </Button>
                          <Button
                            onClick={() => cancelKnockoutEdit(match.id)}
                            disabled={loading}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                    {/* Marcadores */}
                    {match.homeTeam.code !== "TBD" &&
                      match.awayTeam.code !== "TBD" && (
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
                                const homeScore =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value);
                                setEditingScores((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    homeScore,
                                    awayScore:
                                      prev[match.id]?.awayScore !== undefined
                                        ? prev[match.id].awayScore
                                        : match.awayScore,
                                  },
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
                                const awayScore =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value);
                                setEditingScores((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    homeScore:
                                      prev[match.id]?.homeScore !== undefined
                                        ? prev[match.id].homeScore
                                        : match.homeScore,
                                    awayScore,
                                  },
                                }));
                              }}
                              className="w-20 text-center"
                            />
                          </div>
                          {editingScores[match.id] && (
                            <Button
                              onClick={async () => {
                                // Agregar marcadores al estado pendiente
                                updateKnockoutMatchTemp(match.id, {
                                  homeScore: editingScores[match.id].homeScore,
                                  awayScore: editingScores[match.id].awayScore,
                                  status: "FINISHED",
                                });
                                // Guardar todos los cambios pendientes
                                await saveKnockoutMatch(match.id);
                                // Limpiar el estado de edición de marcadores
                                setEditingScores((prev) => {
                                  const next = { ...prev };
                                  delete next[match.id];
                                  return next;
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
              Escribe los marcadores y presiona &ldquo;Guardar Marcadores&rdquo;
              para actualizar cada partido. También puedes cambiar las fechas.
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
                      <CardTitle className="text-lg">
                        Grupo {match.group}
                      </CardTitle>
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
                        <label className="text-sm font-medium">
                          Fecha y Hora (México)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              pendingGroupEdits[match.id]?.date
                                ? extractMexicoCityDateTime(
                                    new Date(pendingGroupEdits[match.id].date!)
                                  ).date
                                : extractMexicoCityDateTime(
                                    new Date(match.date)
                                  ).date
                            }
                            onChange={(e) => {
                              const currentTime = pendingGroupEdits[match.id]
                                ?.date
                                ? extractMexicoCityDateTime(
                                    new Date(pendingGroupEdits[match.id].date!)
                                  ).time
                                : extractMexicoCityDateTime(
                                    new Date(match.date)
                                  ).time;
                              updateGroupMatchTemp(match.id, {
                                date: fromMexicoCityTime(
                                  e.target.value,
                                  currentTime
                                ).toISOString(),
                              });
                            }}
                          />
                          <Input
                            type="time"
                            value={
                              pendingGroupEdits[match.id]?.date
                                ? extractMexicoCityDateTime(
                                    new Date(pendingGroupEdits[match.id].date!)
                                  ).time
                                : extractMexicoCityDateTime(
                                    new Date(match.date)
                                  ).time
                            }
                            onChange={(e) => {
                              const currentDate = pendingGroupEdits[match.id]
                                ?.date
                                ? extractMexicoCityDateTime(
                                    new Date(pendingGroupEdits[match.id].date!)
                                  ).date
                                : extractMexicoCityDateTime(
                                    new Date(match.date)
                                  ).date;
                              updateGroupMatchTemp(match.id, {
                                date: fromMexicoCityTime(
                                  currentDate,
                                  e.target.value
                                ).toISOString(),
                              });
                            }}
                          />
                        </div>
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
                            <span className="text-sm">
                              {match.homeTeam.name}
                            </span>
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
                            <span className="text-sm">
                              {match.awayTeam.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Guardar/Cancelar cambios generales */}
                    {pendingGroupEdits[match.id] &&
                      !editingScores[match.id] && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            onClick={() => saveGroupMatch(match.id)}
                            disabled={loading}
                            className="flex-1"
                            variant="default"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Guardando..." : "Guardar Cambios"}
                          </Button>
                          <Button
                            onClick={() => cancelGroupEdit(match.id)}
                            disabled={loading}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

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
                              : match.homeScore ?? ""
                          }
                          onChange={(e) => {
                            const homeScore =
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value);
                            setEditingScores((prev) => ({
                              ...prev,
                              [match.id]: {
                                homeScore,
                                awayScore:
                                  prev[match.id]?.awayScore !== undefined
                                    ? prev[match.id].awayScore
                                    : match.awayScore ?? null,
                              },
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
                            const awayScore =
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value);
                            setEditingScores((prev) => ({
                              ...prev,
                              [match.id]: {
                                homeScore:
                                  prev[match.id]?.homeScore !== undefined
                                    ? prev[match.id].homeScore
                                    : match.homeScore ?? null,
                                awayScore,
                              },
                            }));
                          }}
                          className="w-20 text-center"
                        />
                      </div>
                      {editingScores[match.id] && (
                        <Button
                          onClick={async () => {
                            // Agregar marcadores al estado pendiente
                            updateGroupMatchTemp(match.id, {
                              homeScore: editingScores[match.id].homeScore ?? 0,
                              awayScore: editingScores[match.id].awayScore ?? 0,
                            });
                            // Guardar todos los cambios pendientes
                            await saveGroupMatch(match.id);
                            // Limpiar el estado de edición de marcadores
                            setEditingScores((prev) => {
                              const next = { ...prev };
                              delete next[match.id];
                              return next;
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
