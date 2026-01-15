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
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.hasPaid
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.name || "Sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user._count.predictions} predicciones
                      </Badge>
                      {user.role === "ADMIN" && (
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {user.hasPaid && user.paidAt && (
                    <div className="text-right mr-2">
                      <p className="text-xs text-muted-foreground">Pagado:</p>
                      <p className="text-xs font-medium">
                        {new Date(user.paidAt).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  )}
                  <Button
                    variant={user.hasPaid ? "outline" : "default"}
                    size="sm"
                    onClick={() => togglePayment(user.id, user.hasPaid)}
                    className={
                      user.hasPaid
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20"
                        : ""
                    }
                  >
                    {user.hasPaid ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pagado
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-1" />
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
