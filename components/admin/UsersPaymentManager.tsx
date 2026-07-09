"use client";

import { useState, useEffect, useMemo } from "react";
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
  Users,
  DollarSign,
  CheckCircle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Copy,
  Check,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { AdminTableSkeleton } from "@/components/ui/skeletons";
import matchesData from "@/data/matches.json";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  hasPaid: boolean;
  paidAt: string | null;
  paidGroupStage: boolean;
  paidGroupStageAt: string | null;
  paidKnockout: boolean;
  paidKnockoutAt: string | null;
  paidFinals: boolean;
  paidFinalsAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    predictions: number;
  };
  predictions: { matchId: string }[];
}

const PHASES = [
  {
    key: "groupStage" as const,
    label: "Fase Grupos",
    shortLabel: "Grupos",
    paidKey: "paidGroupStage" as keyof User,
    paidAtKey: "paidGroupStageAt" as keyof User,
    color: "blue",
  },
  {
    key: "knockout" as const,
    label: "16vos + 8vos",
    shortLabel: "16/8vos",
    paidKey: "paidKnockout" as keyof User,
    paidAtKey: "paidKnockoutAt" as keyof User,
    color: "orange",
  },
  {
    key: "finals" as const,
    label: "Fases Finales",
    shortLabel: "Finales",
    paidKey: "paidFinals" as keyof User,
    paidAtKey: "paidFinalsAt" as keyof User,
    color: "purple",
  },
];

export function UsersPaymentManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState(false);
  const [copiedFinals, setCopiedFinals] = useState(false);
  const [copiedPredictions, setCopiedPredictions] = useState(false);
  const [knockoutMatches, setKnockoutMatches] = useState<any[]>([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    fetch("/api/admin/matches")
      .then(r => r.json())
      .then(data => setKnockoutMatches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhasePayment = async (
    userId: string,
    phase: string,
    currentStatus: boolean,
  ) => {
    const newStatus = !currentStatus;
    // Update locally first
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const updated = { ...u };
        if (phase === "groupStage") {
          updated.paidGroupStage = newStatus;
          updated.paidGroupStageAt = newStatus ? new Date().toISOString() : null;
        } else if (phase === "knockout") {
          updated.paidKnockout = newStatus;
          updated.paidKnockoutAt = newStatus ? new Date().toISOString() : null;
        } else if (phase === "finals") {
          updated.paidFinals = newStatus;
          updated.paidFinalsAt = newStatus ? new Date().toISOString() : null;
        }
        return updated;
      }),
    );
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          phase,
          hasPaid: newStatus,
        }),
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      loadUsers();
    }
  };

  const toggleActive = async (userId: string) => {
    // Update locally first
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)),
    );
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "toggleActive",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Error al cambiar estado del usuario");
        loadUsers();
      }
    } catch (error) {
      console.error("Error toggling user active state:", error);
      loadUsers();
    }
  };

  const getTotalPaid = (user: User) => {
    let total = 0;
    if (user.paidGroupStage) total += 100;
    if (user.paidKnockout) total += 100;
    if (user.paidFinals) total += 100;
    return total;
  };

  const canDeactivate = (user: User) => {
    const hasAnyPayment =
      user.paidGroupStage || user.paidKnockout || user.paidFinals;
    return !hasAnyPayment && user.role !== "ADMIN";
  };

  const fullyPaidUsers = users.filter(
    (u) => u.isActive && u.paidGroupStage && u.paidKnockout && u.paidFinals,
  );
  const partiallyPaidUsers = users.filter(
    (u) =>
      u.isActive &&
      (u.paidGroupStage || u.paidKnockout || u.paidFinals) &&
      !(u.paidGroupStage && u.paidKnockout && u.paidFinals),
  );
  const unpaidUsers = users.filter(
    (u) =>
      u.isActive &&
      !u.paidGroupStage &&
      !u.paidKnockout &&
      !u.paidFinals,
  );
  const unpaidFinalsUsers = users.filter(
    (u) => u.isActive && !u.paidFinals,
  );

  const totalRevenue = users.reduce((acc, u) => acc + getTotalPaid(u), 0);

  // Pagados por fase
  const paidGroupCount = users.filter(u => u.isActive && u.paidGroupStage).length;
  const paidKnockoutCount = users.filter(u => u.isActive && u.paidKnockout).length;
  const paidFinalsCount = users.filter(u => u.isActive && u.paidFinals).length;

  // Calcular partidos de hoy y mañana (usando inicio de día para no perder partidos de hoy)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(startOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);

  // Combinar partidos de grupos + knockout, ordenar, tomar siguientes 4
  const nextMatches = useMemo(() => {
    const groupMatches = matchesData.matches.map(m => ({
      id: `match_${m.id}`,
      date: new Date(m.date),
      name: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      phase: "GROUP_STAGE" as const,
      legacyId: undefined as string | undefined,
    }));
    const koMatches = knockoutMatches.map(m => ({
      id: `match_${m.id}`,
      date: new Date(m.matchDate),
      name: `${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.name ?? "TBD"}`,
      phase: m.phase as string,
      legacyId: undefined as string | undefined,
    }));

    // Índices legacy (match_1000+) para partidos no-grupo, ordenados por fecha,
    // igual que en app/api/predictions/route.ts y en la migración legacy.
    const nonGroupMatches = [...koMatches]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter(m => m.phase !== "GROUP_STAGE");
    nonGroupMatches.forEach((m, index) => {
      m.legacyId = `match_${1000 + index}`;
    });

    const now = new Date();
    return [...groupMatches, ...koMatches]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter(m => m.date >= startOfToday && m.date < endOfTomorrow && m.date > now)
      .slice(0, 4);
  }, [knockoutMatches]);

  // Inicializar selección cuando cambian los próximos partidos
  useEffect(() => {
    setSelectedMatchIds(new Set(nextMatches.map(m => m.id)));
  }, [nextMatches]);

  const upcomingMatchIds = nextMatches
    .filter(m => selectedMatchIds.has(m.id))
    .map(m => m.id);

  // Determina la cuota que cubre la fase del partido.
  const hasPaidForPhase = (u: User, phase: string): boolean => {
    switch (phase) {
      case "GROUP_STAGE":
        return u.paidGroupStage;
      case "ROUND_OF_32":
      case "ROUND_OF_16":
        return u.paidKnockout;
      case "QUARTER_FINAL":
      case "SEMI_FINAL":
      case "THIRD_PLACE":
      case "FINAL":
        return u.paidFinals;
      default:
        return false;
    }
  };

  // Usuarios que pagaron la fase correspondiente a un partido próximo
  // y NO han predicho al menos 1 de esos partidos (soportando matchId legacy).
  const noPredictionsUsers = users.filter((u) => {
    if (!u.isActive) return false;
    if (upcomingMatchIds.length === 0) return false;

    const userPredMatchIds = new Set(u.predictions.map((p) => p.matchId));

    return nextMatches.some((m) => {
      if (!selectedMatchIds.has(m.id)) return false;
      if (!hasPaidForPhase(u, m.phase)) return false;
      const hasPrediction = userPredMatchIds.has(m.id) ||
        (!!m.legacyId && userPredMatchIds.has(m.legacyId));
      return !hasPrediction;
    });
  });

  const copyToClipboard = async (
    text: string,
    type: "payment" | "finals" | "predictions",
  ) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    if (type === "payment") {
      setCopiedPayment(true);
      setTimeout(() => setCopiedPayment(false), 2000);
    } else if (type === "finals") {
      setCopiedFinals(true);
      setTimeout(() => setCopiedFinals(false), 2000);
    } else {
      setCopiedPredictions(true);
      setTimeout(() => setCopiedPredictions(false), 2000);
    }
  };

  const paymentMessage = `⚽ *Quiniela Mundial 2026* ⚽

📋 *Recordatorio de Pago*

Estamos a 1 día de la próxima ronda. Los siguientes participantes tienen pendiente su pago:

${unpaidUsers.map((u) => `• ${u.email || u.name || "Sin nombre"}`).join("\n")}

💳 *Opciones de pago:*
• Fase de Grupos: $100
• 16vos + 8vos: $100
• Fases Finales: $100

🏦 *Datos para depósito:*
CLABE: 002320700942203419
Nombre: Mario Leopoldo Bustillo Eguiluz
Tel: 3317700339

💰 Favor de realizar su depósito y confirmar en el grupo 🙏`;

  const finalsPaymentMessage = `⚽ *Quiniela Mundial 2026* ⚽

🏆 *Recordatorio — Fases Finales*

Ya vienen los Cuartos de Final, la Semifinal, el 3er Lugar y la Gran Final.

Los siguientes participantes aún no han pagado la fase final ($100):

${unpaidFinalsUsers.map((u) => `• ${u.email || u.name || "Sin nombre"}`).join("\n")}

🏦 *Datos para depósito:*
CLABE: 002320700942203419
Nombre: Mario Leopoldo Bustillo Eguiluz
Tel: 3317700339

💰 Favor de realizar su depósito y confirmar en el grupo 🙏`;

  // Nombres de los partidos seleccionados para el mensaje
  const upcomingMatchNames = nextMatches
    .filter(m => selectedMatchIds.has(m.id))
    .map(m => m.name).join(", ");

  const predictionsMessage = `⚽ *Quiniela Mundial 2026* ⚽

📝 *Recordatorio de Predicciones*

${upcomingMatchIds.length > 0
  ? `Próximos partidos: *${upcomingMatchNames}*

Los siguientes participantes *no han metido predicciones* en al menos uno de estos partidos:`
  : `No hay partidos programados para hoy ni mañana.`}

${noPredictionsUsers.map((u) => `• ${u.email || u.name || "Sin nombre"}`).join("\n")}

${upcomingMatchIds.length > 0
  ? `⚠️ *Recuerden ingresar sus predicciones antes de que comiencen los partidos!*`
  : ""}

¡No se queden sin participar! 🏆`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestión de Usuarios y Pagos
        </CardTitle>
        <CardDescription>
          3 fases × $100 cada una = $300 total por participante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                Completos
              </span>
            </div>
            <p className="text-2xl font-bold">{fullyPaidUsers.length}</p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600">
                Parciales
              </span>
            </div>
            <p className="text-2xl font-bold">{partiallyPaidUsers.length}</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">
                Sin pagar
              </span>
            </div>
            <p className="text-2xl font-bold">{unpaidUsers.length}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">
                Total recaudado
              </span>
            </div>
            <p className="text-2xl font-bold">${totalRevenue}</p>
          </div>
        </div>

        {/* Per-phase counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-center">
            <p className="text-xs font-medium text-blue-600">Grupos</p>
            <p className="text-xl font-bold">{paidGroupCount}</p>
          </div>
          <div className="p-2 rounded-lg border border-orange-500/20 bg-orange-500/5 text-center">
            <p className="text-xs font-medium text-orange-600">16vos + 8vos</p>
            <p className="text-xl font-bold">{paidKnockoutCount}</p>
          </div>
          <div className="p-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-center">
            <p className="text-xs font-medium text-purple-600">Fases Finales</p>
            <p className="text-xl font-bold">{paidFinalsCount}</p>
          </div>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
          {PHASES.map((phase) => (
            <div key={phase.key} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-sm bg-${phase.color}-500`} />
              <span className="font-medium">{phase.label}</span>
              <span className="text-muted-foreground">$100</span>
            </div>
          ))}
        </div>

        {loading ? (
          <AdminTableSkeleton />
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users.map((user) => {
              const totalPaid = getTotalPaid(user);
              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    !user.isActive
                      ? "bg-muted/30 border-border opacity-60"
                      : totalPaid === 300
                        ? "bg-green-500/5 border-green-500/30"
                        : totalPaid > 0
                          ? "bg-yellow-500/5 border-yellow-500/30"
                          : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  {/* User info row */}
                  <div className="flex items-center gap-3 mb-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {user.name || "Sin nombre"}
                        </p>
                        {user.role === "ADMIN" && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        {!user.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {user._count.predictions} pred
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {user.role !== "ADMIN" && (
                        <button
                          disabled={!canDeactivate(user) && user.isActive}
                          onClick={() => toggleActive(user.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.isActive
                              ? "bg-primary"
                              : "bg-muted"
                          } ${
                            (!canDeactivate(user) && user.isActive)
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          title={
                            !canDeactivate(user) && user.isActive
                              ? "No se puede desactivar: tiene pagos"
                              : user.isActive
                                ? "Ocultar usuario"
                                : "Reactivar usuario"
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            totalPaid === 300
                              ? "text-green-600"
                              : totalPaid > 0
                                ? "text-yellow-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          ${totalPaid}/300
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phase payment buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {PHASES.map((phase) => {
                      const paid = user[phase.paidKey] as boolean;
                      const paidAt = user[phase.paidAtKey] as string | null;
                      return (
                        <button
                          key={phase.key}
                          onClick={() =>
                            togglePhasePayment(user.id, phase.key, paid)
                          }
                          className={`flex flex-col items-center p-2 rounded-lg border-2 text-xs font-medium transition-all touch-manipulation active:scale-95 ${
                            paid
                              ? "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400"
                              : "bg-muted/50 border-border hover:border-primary/40 text-muted-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {paid ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5" />
                            )}
                            {phase.shortLabel}
                          </span>
                          {paid && paidAt ? (
                            <span className="text-[10px] mt-0.5 opacity-70">
                              {new Date(paidAt).toLocaleDateString("es-MX", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-[10px] mt-0.5 opacity-50">
                              $100
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selección de partidos para el mensaje */}
        {nextMatches.length > 0 && (
          <div className="border-t pt-4 mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Partidos para el recordatorio:
            </p>
            <div className="space-y-1.5">
              {nextMatches.map(m => {
                const checked = selectedMatchIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      checked
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedMatchIds(prev => {
                          const next = new Set(prev);
                          if (next.has(m.id)) {
                            next.delete(m.id);
                          } else {
                            next.add(m.id);
                          }
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {m.date.toLocaleString("es-MX", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Mexico_City",
                        })}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* WhatsApp Buttons */}
        <div className="pt-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Mensajes WhatsApp para el grupo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(paymentMessage, "payment")}
              disabled={unpaidUsers.length === 0}
              className="justify-start"
            >
              {copiedPayment ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
              )}
              {copiedPayment
                ? "¡Copiado!"
                : `Copiar recordatorio de pagos (${unpaidUsers.length})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(finalsPaymentMessage, "finals")}
              disabled={unpaidFinalsUsers.length === 0}
              className="justify-start"
            >
              {copiedFinals ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              )}
              {copiedFinals
                ? "¡Copiado!"
                : `Copiar recordatorio Fases Finales (${unpaidFinalsUsers.length})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(predictionsMessage, "predictions")}
              disabled={noPredictionsUsers.length === 0}
              className="justify-start"
            >
              {copiedPredictions ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />
              )}
              {copiedPredictions
                ? "¡Copiado!"
                : `Copiar recordatorio de predicciones (${noPredictionsUsers.length})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
