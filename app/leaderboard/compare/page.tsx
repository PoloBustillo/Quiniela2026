import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import matchesData from "@/data/matches.json";
import CompareClient from "./CompareClient";
import { ArrowLeft, GitCompare } from "lucide-react";
import Link from "next/link";

export default async function ComparePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  // Get all paid users with predictions
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
    orderBy: { name: "asc" },
  });

  const usersData = users.map((u) => ({
    id: u.id,
    name: u.name || "Usuario",
    image: u.image,
    isCurrentUser: u.id === session.user?.id,
    predictions: u.predictions,
  }));

  // Match map
  const matchMap: Record<string, { home: string; away: string; homeFlag: string; awayFlag: string; group?: string }> = {};
  for (const m of matchesData.matches) {
    matchMap[String(m.id)] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag,
      awayFlag: m.awayTeam.flag,
      group: m.group,
    };
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/leaderboard" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Comparar Predicciones
          </h1>
          <p className="text-xs text-muted-foreground">Compara tus predicciones con otro participante</p>
        </div>
      </div>

      <CompareClient
        users={usersData}
        matchMap={matchMap}
        currentUserId={session.user?.id ?? ""}
      />
    </div>
  );
}
