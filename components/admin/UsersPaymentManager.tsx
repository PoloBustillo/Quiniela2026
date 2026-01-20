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
import { Users, DollarSign, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  hasPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  _count: {
    predictions: number;
  };
}

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

  const togglePayment = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
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

  const paidUsers = users.filter((u) => u.hasPaid);
  const unpaidUsers = users.filter((u) => !u.hasPaid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestión de Usuarios y Pagos
        </CardTitle>
        <CardDescription>
          Marca los usuarios que han pagado para incluirlos en la tabla de
          posiciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Pagados
              </span>
            </div>
            <p className="text-2xl font-bold">{paidUsers.length}</p>
          </div>
          <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                Pendientes
              </span>
            </div>
            <p className="text-2xl font-bold">{unpaidUsers.length}</p>
          </div>
        </div>

        {loading ? (
          <AdminTableSkeleton />
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  user.hasPaid
                    ? "bg-green-500/5 border-green-500/30 shadow-sm"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={48}
                      height={48}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-base truncate">{user.name || "Sin nombre"}</p>
                      {user.role === "ADMIN" && (
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">
                        {user._count.predictions} predicciones
                      </Badge>
                      {user.hasPaid && user.paidAt && (
                        <span className="text-xs text-green-600 font-medium">
                          Pagado {new Date(user.paidAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button
                    variant={user.hasPaid ? "outline" : "default"}
                    size="default"
                    onClick={() => togglePayment(user.id, user.hasPaid)}
                    className={
                      user.hasPaid
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20 min-h-[44px] min-w-[140px] touch-manipulation active:scale-95 transition-transform font-semibold"
                        : "min-h-[44px] min-w-[140px] touch-manipulation active:scale-95 transition-transform font-semibold"
                    }
                  >
                    {user.hasPaid ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Pagado
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5 mr-2" />
                        Marcar Pagado
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
