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
import {
  Trophy,
  Calendar,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Users,
  Hash,
} from "lucide-react";
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
  new Set(stadiumsData.stadiums.map((s) => s.city)),
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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Estado unificado para ediciones de knockout
  const [knockoutEdits, setKnockoutEdits] = useState<{
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

  // Estado unificado para ediciones de grupos
  const [groupEdits, setGroupEdits] = useState<{
    [matchId: number]: {
      homeScore?: number | null;
      awayScore?: number | null;
      matchDate?: string;
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
      const response = await fetch(
        `/api/admin/matches?phase=${selectedPhase}&t=${Date.now()}`,
        {
          cache: "no-store",
        },
      );
      const data = await response.json();
      console.log("🔄 Partidos knockout cargados:", data.length);
      if (data.length > 0) {
        console.log("📋 Ejemplo de partido knockout:", data[0]);
      }
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
      const response = await fetch(`/api/admin/group-matches?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      console.log("🔄 Partidos de grupo cargados:", data.length);
      if (data.length > 0) {
        console.log("📋 Ejemplo de partido grupo:", data[0]);
      }
      setGroupMatches(data);
    } catch (error) {
      console.error("Error loading group matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: obtener fecha válida de forma segura
  const getValidDate = (dateValue: string | undefined | null): Date => {
    if (!dateValue) {
      console.warn("No date value provided");
      return new Date();
    }
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", dateValue);
      return new Date();
    }
    return date;
  };

  // Actualizar knockout match
  const updateKnockoutMatch = (matchId: string, updates: any) => {
    console.log("🔄 updateKnockoutMatch llamado:", { matchId, updates });
    setKnockoutEdits((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  // Guardar knockout match
  const saveKnockoutMatch = async (matchId: string) => {
    const edits = knockoutEdits[matchId];
    if (!edits) {
      showToast("No hay cambios pendientes", "error");
      return;
    }

    // Obtener el partido original
    const originalMatch = matches.find((m) => m.id === matchId);
    if (!originalMatch) {
      showToast("Partido no encontrado", "error");
      return;
    }

    try {
      setLoading(true);
      const updateData: any = { id: matchId };

      // Solo enviar scores si SE EDITARON (no si se tocaron otros campos)
      const scoresWereEdited =
        edits.homeScore !== undefined || edits.awayScore !== undefined;
      if (scoresWereEdited) {
        updateData.homeScore =
          edits.homeScore !== undefined
            ? edits.homeScore
            : originalMatch.homeScore;
        updateData.awayScore =
          edits.awayScore !== undefined
            ? edits.awayScore
            : originalMatch.awayScore;
      }

      // Otros campos solo si cambiaron
      if (edits.homeTeamId && edits.homeTeamId !== originalMatch.homeTeamId) {
        updateData.homeTeamId = edits.homeTeamId;
      }
      if (edits.awayTeamId && edits.awayTeamId !== originalMatch.awayTeamId) {
        updateData.awayTeamId = edits.awayTeamId;
      }
      if (edits.matchDate) {
        updateData.matchDate = edits.matchDate;
      }
      if (
        edits.stadium !== undefined &&
        edits.stadium !== originalMatch.stadium
      ) {
        updateData.stadium = edits.stadium;
      }
      if (edits.city !== undefined && edits.city !== originalMatch.city) {
        updateData.city = edits.city;
      }
      if (edits.status && edits.status !== originalMatch.status) {
        updateData.status = edits.status;
      }

      console.log("📤 Enviando actualización knockout:", updateData);
      console.log("📝 Estado de edits:", edits);
      console.log("📋 Match original:", {
        id: originalMatch.id,
        homeScore: originalMatch.homeScore,
        awayScore: originalMatch.awayScore,
        matchDate: originalMatch.matchDate,
      });
      console.log("🔍 Scores editados?", scoresWereEdited);
      console.log(
        "📨 JSON que se enviará:",
        JSON.stringify(updateData, null, 2),
      );

      const response = await fetch("/api/admin/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar");
      }

      await loadKnockoutMatches();
      setKnockoutEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[matchId];
        return newEdits;
      });
      showToast("Partido actualizado", "success");
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición knockout
  const cancelKnockoutEdit = (matchId: string) => {
    setKnockoutEdits((prev) => {
      const newEdits = { ...prev };
      delete newEdits[matchId];
      return newEdits;
    });
  };

  // Actualizar estado temporal de grupos
  const updateGroupMatch = (matchId: number, updates: any) => {
    setGroupEdits((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  // Guardar cambios de grupo
  const saveGroupMatch = async (matchId: number) => {
    const updates = groupEdits[matchId];
    if (!updates) {
      showToast("No hay cambios pendientes", "error");
      return;
    }

    // Obtener el partido original
    const originalMatch = groupMatches.find((m) => m.id === matchId);
    if (!originalMatch) {
      showToast("Partido no encontrado", "error");
      return;
    }

    try {
      setLoading(true);
      const updateData: any = { matchId };

      // Solo enviar scores si SE EDITARON (no si se tocaron otros campos)
      const scoresWereEdited =
        updates.homeScore !== undefined || updates.awayScore !== undefined;
      if (scoresWereEdited) {
        updateData.homeScore =
          updates.homeScore !== undefined
            ? updates.homeScore
            : originalMatch.homeScore;
        updateData.awayScore =
          updates.awayScore !== undefined
            ? updates.awayScore
            : originalMatch.awayScore;
      }

      if (updates.matchDate) {
        updateData.matchDate = updates.matchDate;
      }

      console.log("📤 Enviando actualización grupo:", updateData);
      console.log("📝 Estado de updates:", updates);
      console.log("📋 Match original:", {
        homeScore: originalMatch.homeScore,
        awayScore: originalMatch.awayScore,
      });

      const response = await fetch("/api/admin/group-matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log("📡 Respuesta del servidor (grupo):", result);

      if (response.ok) {
        await loadGroupMatches();
        setGroupEdits((prev) => {
          const newEdits = { ...prev };
          delete newEdits[matchId];
          return newEdits;
        });
        showToast("Partido actualizado correctamente", "success");
      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (error) {
      console.error("Error updating group match:", error);
      showToast("Error al actualizar el partido", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar cambios de grupo
  const cancelGroupEdit = (matchId: number) => {
    setGroupEdits((prev) => {
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
                  ),
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
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(match.matchDate).toLocaleDateString(
                            "es-MX",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span className="font-medium">
                          {new Date(match.matchDate).toLocaleTimeString(
                            "es-MX",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                      {match.stadium && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {match.stadium}
                        </div>
                      )}
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
                            knockoutEdits[match.id]?.homeTeamId ||
                            match.homeTeam.id
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatch(match.id, {
                              homeTeamId: value,
                            });
                          }}
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
                            knockoutEdits[match.id]?.awayTeamId ||
                            match.awayTeam.id
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatch(match.id, {
                              awayTeamId: value,
                            });
                          }}
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
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Fecha y Hora (México)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              extractMexicoCityDateTime(
                                getValidDate(
                                  knockoutEdits[match.id]?.matchDate ??
                                    match.matchDate,
                                ),
                              ).date
                            }
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const currentTime = extractMexicoCityDateTime(
                                getValidDate(
                                  knockoutEdits[match.id]?.matchDate ??
                                    match.matchDate,
                                ),
                              ).time;
                              updateKnockoutMatch(match.id, {
                                matchDate: fromMexicoCityTime(
                                  e.target.value,
                                  currentTime,
                                ).toISOString(),
                              });
                            }}
                            disabled={match.status === "FINISHED"}
                            className="h-11 text-base touch-manipulation"
                          />
                          <Input
                            type="time"
                            value={
                              extractMexicoCityDateTime(
                                getValidDate(
                                  knockoutEdits[match.id]?.matchDate ??
                                    match.matchDate,
                                ),
                              ).time
                            }
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const currentDate = extractMexicoCityDateTime(
                                getValidDate(
                                  knockoutEdits[match.id]?.matchDate ??
                                    match.matchDate,
                                ),
                              ).date;
                              updateKnockoutMatch(match.id, {
                                matchDate: fromMexicoCityTime(
                                  currentDate,
                                  e.target.value,
                                ).toISOString(),
                              });
                            }}
                            disabled={match.status === "FINISHED"}
                            className="h-11 text-base touch-manipulation"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estadio</label>
                        <Select
                          value={
                            knockoutEdits[match.id]?.stadium ??
                            match.stadium ??
                            ""
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatch(match.id, {
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
                            knockoutEdits[match.id]?.city ?? match.city ?? ""
                          }
                          onValueChange={(value) => {
                            updateKnockoutMatch(match.id, {
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
                                knockoutEdits[match.id]?.homeScore !== undefined
                                  ? (knockoutEdits[match.id].homeScore ?? "")
                                  : (match.homeScore ?? "")
                              }
                              onChange={(e) => {
                                const homeScore =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value);
                                updateKnockoutMatch(match.id, {
                                  homeScore,
                                  status: "FINISHED",
                                });
                              }}
                              className="w-20 text-center"
                            />
                            <span className="text-2xl font-bold">-</span>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={
                                knockoutEdits[match.id]?.awayScore !== undefined
                                  ? (knockoutEdits[match.id].awayScore ?? "")
                                  : (match.awayScore ?? "")
                              }
                              onChange={(e) => {
                                const awayScore =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value);
                                updateKnockoutMatch(match.id, {
                                  awayScore,
                                  status: "FINISHED",
                                });
                              }}
                              className="w-20 text-center"
                            />
                          </div>
                        </div>
                      )}

                    {/* Botones de Guardar/Cancelar cambios generales - Movidos al final */}
                    {knockoutEdits[match.id] && (
                      <div className="flex gap-2 pt-4 border-t mt-4">
                        <Button
                          onClick={() => {
                            console.log(
                              "💾 Botón Guardar clickeado para:",
                              match.id,
                            );
                            saveKnockoutMatch(match.id);
                          }}
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
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(match.date).toLocaleDateString("es-MX", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span className="font-medium">
                          {new Date(match.date).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {match.stadium && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {match.stadium}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fecha */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Fecha y Hora (México)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={
                              extractMexicoCityDateTime(
                                getValidDate(
                                  groupEdits[match.id]?.matchDate ?? match.date,
                                ),
                              ).date
                            }
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const currentTime = extractMexicoCityDateTime(
                                getValidDate(
                                  groupEdits[match.id]?.matchDate ?? match.date,
                                ),
                              ).time;
                              updateGroupMatch(match.id, {
                                matchDate: fromMexicoCityTime(
                                  e.target.value,
                                  currentTime,
                                ).toISOString(),
                              });
                            }}
                            className="h-11 text-base touch-manipulation"
                          />
                          <Input
                            type="time"
                            value={
                              extractMexicoCityDateTime(
                                getValidDate(
                                  groupEdits[match.id]?.matchDate ?? match.date,
                                ),
                              ).time
                            }
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const currentDate = extractMexicoCityDateTime(
                                getValidDate(
                                  groupEdits[match.id]?.matchDate ?? match.date,
                                ),
                              ).date;
                              updateGroupMatch(match.id, {
                                matchDate: fromMexicoCityTime(
                                  currentDate,
                                  e.target.value,
                                ).toISOString(),
                              });
                            }}
                            className="h-11 text-base touch-manipulation"
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
                            groupEdits[match.id]?.homeScore !== undefined
                              ? (groupEdits[match.id].homeScore ?? "")
                              : (match.homeScore ?? "")
                          }
                          onChange={(e) => {
                            const homeScore =
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value);
                            updateGroupMatch(match.id, { homeScore });
                          }}
                          className="w-20 text-center"
                        />
                        <span className="text-2xl font-bold">-</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={
                            groupEdits[match.id]?.awayScore !== undefined
                              ? (groupEdits[match.id].awayScore ?? "")
                              : (match.awayScore ?? "")
                          }
                          onChange={(e) => {
                            const awayScore =
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value);
                            updateGroupMatch(match.id, { awayScore });
                          }}
                          className="w-20 text-center"
                        />
                      </div>
                    </div>

                    {/* Botones de Guardar/Cancelar cambios generales - Movidos al final */}
                    {groupEdits[match.id] && (
                      <div className="flex gap-2 pt-4 border-t mt-4">
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
