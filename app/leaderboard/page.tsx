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
import { parseMatchDate } from "@/lib/points";

export const revalidate = 30;

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

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const users = await prisma.user.findMany({
    where: { isActive: true },
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

  const totalUsers = await prisma.user.count({
    where: { isActive: true },
  });
  const paidUsers = await prisma.user.count({
    where: {
      isActive: true,
      OR: [
        { hasPaid: true },
        { paidGroupStage: true },
        { paidKnockout: true },
        { paidFinals: true },
      ],
    },
  });
  const paidGroupStageCount = await prisma.user.count({
    where: { isActive: true, OR: [{ hasPaid: true }, { paidGroupStage: true }] },
  });
  const paidKnockoutCount = await prisma.user.count({
    where: { isActive: true, OR: [{ hasPaid: true }, { paidKnockout: true }] },
  });
  const paidFinalsCount = await prisma.user.count({
    where: { isActive: true, OR: [{ hasPaid: true }, { paidFinals: true }] },
  });
  const totalPredictions = await prisma.prediction.count();
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

  // Fetch finished group-stage match IDs (scored in GroupMatchScore)
  const finishedGroupScores = await prisma.groupMatchScore.findMany({
    where: { homeScore: { not: null }, awayScore: { not: null } },
    select: { matchId: true },
  });
  const finishedMatchIds = finishedGroupScores.map((s) => `match_${s.matchId}`);

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

  const finishedKnockoutIds = knockoutMatches
    .filter((match) => match.status === "FINISHED")
    .map((match) => `match_${match.id}`);

  const legacyFinishedKnockoutIds = knockoutMatches
    .map((match, index) => ({ match, legacyId: `match_${1000 + index}` }))
    .filter(({ match }) => match.status === "FINISHED")
    .map(({ legacyId }) => legacyId);

  const finishedMatchIdSet = [
    ...finishedMatchIds,
    ...finishedKnockoutIds,
    ...legacyFinishedKnockoutIds,
  ];
  const finishedMatchDayMap: Record<string, string> = {};

  const toMexDay = (d: Date) =>
    d.toLocaleDateString("sv-SE", {
      timeZone: "America/Mexico_City",
    });

  const groupById = new Map(matchesData.matches.map((m) => [m.id, m]));
  for (const finished of finishedGroupScores) {
    const gm = groupById.get(finished.matchId);
    if (!gm) continue;
    const overrideDate = groupDateOverrideMap.get(finished.matchId);
    const matchDate = overrideDate || parseMatchDate(gm.date);
    finishedMatchDayMap[`match_${finished.matchId}`] = toMexDay(matchDate);
  }

  knockoutMatches.forEach((match, index) => {
    if (match.status !== "FINISHED") return;
    const day = toMexDay(match.matchDate);
    finishedMatchDayMap[`match_${match.id}`] = day;
    finishedMatchDayMap[`match_${1000 + index}`] = day;
  });

  const startedKnockoutIds = knockoutMatches
    .filter((match) => match.matchDate <= now)
    .map((match) => `match_${match.id}`);

  const legacyStartedKnockoutIds = knockoutMatches
    .map((match, index) => ({ match, legacyId: `match_${1000 + index}` }))
    .filter(({ match }) => match.matchDate <= now)
    .map(({ legacyId }) => legacyId);

  // ── Auto-detect current torneo based on started matches ──────────────────
  let defaultTorneo = "T1";
  for (const m of knockoutMatches) {
    if (m.matchDate <= now) {
      if (m.phase === "ROUND_OF_32" || m.phase === "ROUND_OF_16") {
        defaultTorneo = "T2";
        break;
      }
      if (defaultTorneo === "T1" && ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"].includes(m.phase)) {
        defaultTorneo = "T3";
      }
    }
  }

  // Fallback: si aún en T1 pero todos los grupos terminaron, ir a T2
  if (defaultTorneo === "T1") {
    const finishedGroupIds = new Set(finishedGroupScores.map(s => s.matchId));
    const allGroupDone = matchesData.matches.every(m => {
      const overrideDate = groupDateOverrideMap.get(m.id);
      const matchDate = overrideDate || parseMatchDate(m.date);
      return finishedGroupIds.has(m.id) || matchDate <= now;
    });
    const hasT2Matches = knockoutMatches.some(m => m.phase === "ROUND_OF_32" || m.phase === "ROUND_OF_16");
    if (allGroupDone && hasT2Matches) {
      defaultTorneo = "T2";
    }
  }

  // ── Detectar partidos en vivo ──────────────────────────────────────────────
  // Knockout: status === "LIVE" en DB (seteado por BSD sync)
  const liveKnockoutIds = knockoutMatches
    .filter((match) => match.status === "LIVE")
    .map((match) => `match_${match.id}`);

  // Grupos: heurística — empezó hace menos de 3h (ventana típica de un partido)
  // No usar finishedMatchIds porque BSD escribe scores durante el partido en vivo
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const liveGroupIds = matchesData.matches
    .filter((m) => {
      const overrideDate = groupDateOverrideMap.get(m.id);
      const matchDate = overrideDate || parseMatchDate(m.date);
      const started = matchDate <= now;
      const withinWindow = matchDate > threeHoursAgo;
      return started && withinWindow;
    })
    .map((m) => `match_${m.id}`);
  const liveMatchIdSet = new Set([...liveKnockoutIds, ...liveGroupIds]);

  // Scores reales de partidos en vivo (para mostrar en leaderboard)
  const liveScoresMap: Record<string, { home: number | null; away: number | null }> = {};
  // Grupos en vivo
  const liveGroupScores = await prisma.groupMatchScore.findMany({
    where: {
      matchId: {
        in: liveGroupIds.map((id) => parseInt(id.replace("match_", ""))),
      },
    },
    select: { matchId: true, homeScore: true, awayScore: true },
  });

  // Remover partidos que empezaron hace >2.5h y tienen marcador (ya terminaron)
  const twoHoursAgo = new Date(now.getTime() - 135 * 60 * 1000);
  for (const gs of liveGroupScores) {
    if (gs.homeScore == null || gs.awayScore == null) continue;
    const gm = groupById.get(gs.matchId);
    if (!gm) continue;
    const overrideDate = groupDateOverrideMap.get(gs.matchId);
    const matchDate = overrideDate || parseMatchDate(gm.date);
    if (matchDate <= twoHoursAgo) {
      liveMatchIdSet.delete(`match_${gs.matchId}`);
    }
  }
  for (const km of liveKnockoutIds) {
    const match = knockoutMatches.find((m) => `match_${m.id}` === km);
    if (match && match.status !== "LIVE") {
      liveMatchIdSet.delete(km);
    }
  }

  for (const gs of liveGroupScores) {
    liveScoresMap[`match_${gs.matchId}`] = {
      home: gs.homeScore,
      away: gs.awayScore,
    };
  }
  // Eliminatorias en vivo
  for (const km of liveKnockoutIds) {
    const match = knockoutMatches.find((m) => `match_${m.id}` === km);
    if (match) {
      liveScoresMap[km] = {
        home: match.homeScore,
        away: match.awayScore,
      };
    }
  }

  const startedMatchIdSet = new Set([
    ...startedGroupIds,
    ...startedKnockoutIds,
    ...legacyStartedKnockoutIds,
  ]);

  const usersWithPoints = users.map((user) => ({
    id: user.id,
    name: user.name || "Usuario",
    email: user.email,
    image: user.image,
    isCurrentUser: user.id === session.user?.id,
    hasPaid: user.hasPaid,
    paidGroupStage: user.paidGroupStage,
    paidKnockout: user.paidKnockout,
    paidFinals: user.paidFinals,
    predictions: user.predictions.map((pred) => {
      const normalizedMatchId = normalizePredictionMatchId(
        pred.matchId,
        knockoutMatches,
      );
      const canSeeScores =
        user.id === session.user?.id ||
        startedMatchIdSet.has(normalizedMatchId);

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

  // Build a lightweight match map: matchId (string) -> { home, away }
  const matchMap: Record<
    string,
    {
      home: string;
      away: string;
      homeFlag: string;
      awayFlag: string;
      group?: string;
      phase?: string;
      order?: number;
      date?: string;
    }
  > = {};
  for (const m of matchesData.matches) {
    // Use DB override date if available, otherwise JSON date
    const overrideDate = groupDateOverrideMap.get(m.id);
    const matchDate = overrideDate
      ? overrideDate.toISOString()
      : m.date;
    matchMap[String(m.id)] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag,
      awayFlag: m.awayTeam.flag,
      group: m.group,
      phase: (m as { phase?: string }).phase,
      order: m.id,
      date: matchDate,
    };
  }

  knockoutMatches.forEach((m, index) => {
    matchMap[m.id] = {
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeFlag: m.homeTeam.flag || "/flags/tbd.png",
      awayFlag: m.awayTeam.flag || "/flags/tbd.png",
      phase: m.phase,
      order: 1000 + index,
      date: m.matchDate.toISOString(),
    };
  });

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Tabla de Posiciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {usersWithPoints.length} participante
            {usersWithPoints.length !== 1 ? "s" : ""}
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
            <p>
              Para aparecer en la tabla, los usuarios deben ser marcados como
              pagados por un admin.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">
                  {totalUsers}
                </p>
                <p className="text-xs">Total</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">{paidUsers}</p>
                <p className="text-xs">Pagados</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xl font-bold text-foreground">
                  {totalPredictions}
                </p>
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
        <LeaderboardByPhase
          users={usersWithPoints}
          matchMap={matchMap}
          currentUserId={session.user?.id ?? ""}
          finishedMatchIds={finishedMatchIdSet}
          finishedMatchDayMap={finishedMatchDayMap}
          paidCounts={{ T1: paidGroupStageCount, T2: paidKnockoutCount, T3: paidFinalsCount }}
          liveMatchIds={Array.from(liveMatchIdSet)}
          liveScores={liveScoresMap}
          defaultTorneo={defaultTorneo}
        />
      )}
    </div>
  );
}
