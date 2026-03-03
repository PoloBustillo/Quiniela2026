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
  Users,
  DollarSign,
  CheckCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { AdminTableSkeleton } from "@/components/ui/skeletons";

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
  createdAt: string;
  _count: {
    predictions: number;
  };
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
    label: "32vos + 16vos",
    shortLabel: "32/16vos",
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhasePayment = async (
    userId: string,
    phase: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          phase,
          hasPaid: !currentStatus,
        }),
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const getTotalPaid = (user: User) => {
    let total = 0;
    if (user.paidGroupStage) total += 100;
    if (user.paidKnockout) total += 100;
    if (user.paidFinals) total += 100;
    return total;
  };

  const fullyPaidUsers = users.filter(
    (u) => u.paidGroupStage && u.paidKnockout && u.paidFinals
  );
  const partiallyPaidUsers = users.filter(
    (u) =>
      (u.paidGroupStage || u.paidKnockout || u.paidFinals) &&
      !(u.paidGroupStage && u.paidKnockout && u.paidFinals)
  );
  const unpaidUsers = users.filter(
    (u) => !u.paidGroupStage && !u.paidKnockout && !u.paidFinals
  );

  const totalRevenue = users.reduce((acc, u) => acc + getTotalPaid(u), 0);

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
              <span className="text-xs font-medium text-green-600">Completos</span>
            </div>
            <p className="text-2xl font-bold">{fullyPaidUsers.length}</p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600">Parciales</span>
            </div>
            <p className="text-2xl font-bold">{partiallyPaidUsers.length}</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Sin pagar</span>
            </div>
            <p className="text-2xl font-bold">{unpaidUsers.length}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Total recaudado</span>
            </div>
            <p className="text-2xl font-bold">${totalRevenue}</p>
          </div>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
          {PHASES.map((phase) => (
            <div key={phase.key} className="flex items-center gap-1.5 text-xs">
              <div
                className={`w-3 h-3 rounded-sm bg-${phase.color}-500`}
              />
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
                    totalPaid === 300
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
                        <Badge variant="outline" className="text-xs">
                          {user._count.predictions} pred
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
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
      </CardContent>
    </Card>
  );
}
