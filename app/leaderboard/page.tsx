import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
            Solo usuarios que han pagado su inscripción. Filtra por fase para ver rankings específicos.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {usersWithPoints.length} participantes
        </Badge>
      </div>

      <LeaderboardByPhase users={usersWithPoints} />
    </div>
  );
}
