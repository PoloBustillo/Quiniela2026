import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import LeaderboardByPhase from "@/components/LeaderboardByPhase";
import matchesData from "@/data/matches.json";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { hasPaid: true },
        { paidGroupStage: true },
        { paidKnockout: true },
        { paidFinals: true },
      ],
    },
    include: {
      predictions: {
        select: {
          matchId: true,
          phase: true,
          points: true,
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });

  const totalUsers = await prisma.user.count();
  const paidUsers = await prisma.user.count({
    where: {
      OR: [
        { hasPaid: true },
        { paidGroupStage: true },
        { paidKnockout: true },
        { paidFinals: true },
      ],
    },
  });
  const totalPredictions = await prisma.prediction.count();

  const usersWithPoints = users.map((user) => ({
    id: user.id,
    name: user.name || "Usuario",
    email: user.email,
    image: user.image,
    isCurrentUser: user.id === session.user?.id,
    predictions: user.predictions,
  }));

  // Build a lightweight match map: matchId (string) -> { home, away }
  const matchMap: Record<string, { home: string; away: string; homeFlag: string; awayFlag: string; group?: string; phase?: string }> = {};
  for (const m of matchesData.matches) {
    matchMap[String(m.id)] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag,
      awayFlag: m.awayTeam.flag,
      group: m.group,
      phase: (m as { phase?: string }).phase,
    };
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Tabla de Posiciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {usersWithPoints.length} participante{usersWithPoints.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Badge variant="secondary">{usersWithPoints.length}p</Badge>
      </div>

      {usersWithPoints.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-yellow-500" />
              No hay participantes aún
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Para aparecer en la tabla, los usuarios deben ser marcados como pagados por un admin.</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">{totalUsers}</p>
                <p className="text-xs">Total</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">{paidUsers}</p>
                <p className="text-xs">Pagados</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">{totalPredictions}</p>
                <p className="text-xs">Predicciones</p>
              </div>
            </div>
            {session.user?.role === "ADMIN" && (
              <Button asChild className="w-full" size="sm">
                <a href="/admin">Ir a Administración</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <LeaderboardByPhase users={usersWithPoints} matchMap={matchMap} currentUserId={session.user?.id ?? ""} />
      )}
    </div>
  );
}
