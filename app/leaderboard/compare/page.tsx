import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import matchesData from "@/data/matches.json";
import CompareClient from "./CompareClient";
import { ArrowLeft, GitCompare } from "lucide-react";
import Link from "next/link";
import { parseMatchDate } from "@/lib/points";

const normalizePredictionMatchId = (
  matchId: string,
  knockoutMatches: { id: string }[],
) => {
  if (!matchId.startsWith("match_")) return matchId;
  const rawId = matchId.replace("match_", "");
  if (!/^\d+$/.test(rawId)) return matchId;

  const numericId = Number(rawId);
  if (numericId >= 1000) {
    const knockoutIndex = numericId - 1000;
    const knockoutMatch = knockoutMatches[knockoutIndex];
    if (knockoutMatch) {
      return `match_${knockoutMatch.id}`;
    }
  }

  return matchId;
};

export default async function ComparePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  // Get all users with predictions
  const users = await prisma.user.findMany({
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

  const now = new Date();
  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: {
        not: "GROUP_STAGE",
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      matchDate: "asc",
    },
  });

  const groupDateOverrides = await prisma.groupMatchScore.findMany({
    select: { matchId: true, matchDate: true },
  });
  const groupDateOverrideMap = new Map(
    groupDateOverrides.map((m) => [m.matchId, m.matchDate]),
  );

  const startedGroupIds = matchesData.matches
    .filter((m) => {
      const overrideDate = groupDateOverrideMap.get(m.id);
      const matchDate = overrideDate || parseMatchDate(m.date);
      return matchDate <= now;
    })
    .map((m) => `match_${m.id}`);

  const startedKnockoutIds = knockoutMatches
    .filter((m) => m.matchDate <= now)
    .map((m) => `match_${m.id}`);

  const legacyStartedKnockoutIds = knockoutMatches
    .map((m, index) => ({ m, legacyId: `match_${1000 + index}` }))
    .filter(({ m }) => m.matchDate <= now)
    .map(({ legacyId }) => legacyId);

  const startedMatchIdSet = new Set([
    ...startedGroupIds,
    ...startedKnockoutIds,
    ...legacyStartedKnockoutIds,
  ]);

  const usersData = users.map((u) => ({
    id: u.id,
    name: u.name || "Usuario",
    image: u.image,
    isCurrentUser: u.id === session.user?.id,
    predictions: u.predictions.map((pred) => {
      const normalizedMatchId = normalizePredictionMatchId(
        pred.matchId,
        knockoutMatches,
      );
      const canSeeScores =
        u.id === session.user?.id || startedMatchIdSet.has(normalizedMatchId);

      const normalizedPred = {
        ...pred,
        matchId: normalizedMatchId,
      };

      if (canSeeScores) {
        return normalizedPred;
      }

      return {
        ...normalizedPred,
        homeScore: null,
        awayScore: null,
      };
    }),
  }));

  // Match map
  const matchMap: Record<
    string,
    {
      home: string;
      away: string;
      homeFlag: string;
      awayFlag: string;
      group?: string;
    }
  > = {};
  for (const m of matchesData.matches) {
    matchMap[String(m.id)] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag,
      awayFlag: m.awayTeam.flag,
      group: m.group,
    };
  }

  knockoutMatches.forEach((m) => {
    matchMap[m.id] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag || "/flags/tbd.png",
      awayFlag: m.awayTeam.flag || "/flags/tbd.png",
    };
  });

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/leaderboard"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Comparar Predicciones
          </h1>
          <p className="text-xs text-muted-foreground">
            Compara tus predicciones con otro participante
          </p>
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
