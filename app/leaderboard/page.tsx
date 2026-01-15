import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import LeaderboardByPhase from "@/components/LeaderboardByPhase";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Obtener todos los usuarios que han pagado con sus predicciones
  const users = await prisma.user.findMany({
    where: {
      hasPaid: true, // Solo usuarios que han pagado
    },
    include: {
      predictions: {
        select: {
          phase: true,
          points: true,
        },
      },
    },
  });

  // También obtener estadísticas generales para debug
  const totalUsers = await prisma.user.count();
  const paidUsers = await prisma.user.count({ where: { hasPaid: true } });
  const totalPredictions = await prisma.prediction.count();

  // Transformar datos para el componente
  const usersWithPoints = users.map((user) => ({
    id: user.id,
    name: user.name || "Usuario",
    email: user.email,
    image: user.image,
    isCurrentUser: user.id === session.user?.id,
    predictions: user.predictions,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Tabla de Posiciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Solo usuarios que han pagado su inscripción. Filtra por fase para
            ver rankings específicos.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            {usersWithPoints.length} participantes
          </Badge>
          {usersWithPoints.length === 0 && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>👥 Total usuarios: {totalUsers}</p>
              <p>💰 Usuarios que han pagado: {paidUsers}</p>
              <p>📊 Total predicciones: {totalPredictions}</p>
            </div>
          )}
        </div>
      </div>

      {usersWithPoints.length === 0 ? (
        <div className="grid gap-4">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                No hay participantes aún
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Para aparecer en la tabla de posiciones, los usuarios deben:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  Ser marcados como &ldquo;Pagado&rdquo; por un administrador
                </li>
                <li>Hacer al menos una predicción de partido</li>
              </ol>
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold">📊 Estadísticas actuales:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total usuarios</p>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Han pagado</p>
                    <p className="text-2xl font-bold">{paidUsers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total predicciones</p>
                    <p className="text-2xl font-bold">{totalPredictions}</p>
                  </div>
                </div>
              </div>
              {session.user?.role === "ADMIN" && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">
                    🔧 Como administrador:
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ve a la página de administración para marcar usuarios como
                    pagados.
                  </p>
                  <Button asChild>
                    <a href="/admin">Ir a Administración</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <LeaderboardByPhase users={usersWithPoints} />
      )}
    </div>
  );
}
