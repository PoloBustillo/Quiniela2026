import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import matchesData from "@/data/matches.json";
import { prisma } from "@/lib/prisma";
import { getBsdEventIdForGroupMatch } from "@/lib/bsd-mapping";
import {
  getEventDetail,
  getEventStats,
  getEventIncidents,
  getEventLineups,
  getEventPlayerStats,
  getEventOdds,
  getEventPrediction,
  getEventMetadata,
} from "@/lib/bsd-client";
import { MatchDetailTabs } from "@/components/MatchDetailTabs";

// ISR: re-render every 30s — keeps live scores fresh without SSE
export const revalidate = 30;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const matchId = parseInt(params.id);
  const match = (matchesData as any).matches?.find(
    (m: any) => m.id === matchId,
  );
  if (!match) return { title: "Partido | Quiniela 2026" };
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} | Quiniela 2026`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const matchId = parseInt(params.id);
  if (isNaN(matchId) || matchId < 1) notFound();

  const allMatches = (matchesData as any).matches as any[];
  const match = allMatches.find((m) => m.id === matchId);
  if (!match) notFound();

  // ── DB data ──────────────────────────────────────────────────────────────────
  const [dbScore, userPrediction] = await Promise.all([
    prisma.groupMatchScore.findUnique({ where: { matchId } }),
    prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId: String(matchId),
        },
      },
    }),
  ]);

  // ── BSD data (best-effort, never blocks render) ───────────────────────────
  const bsdEventId = getBsdEventIdForGroupMatch(matchId);

  let bsdCore = null,
    bsdStats = null,
    bsdIncidents = null,
    bsdLineups = null,
    bsdPlayerStats = null,
    bsdOdds = null,
    bsdPrediction = null,
    bsdMetadata = null;

  if (bsdEventId) {
    const results = await Promise.allSettled([
      getEventDetail(bsdEventId),
      getEventStats(bsdEventId),
      getEventIncidents(bsdEventId),
      getEventLineups(bsdEventId),
      getEventPlayerStats(bsdEventId),
      getEventOdds(bsdEventId),
      getEventPrediction(bsdEventId),
      getEventMetadata(bsdEventId),
    ]);
    [
      bsdCore,
      bsdStats,
      bsdIncidents,
      bsdLineups,
      bsdPlayerStats,
      bsdOdds,
      bsdPrediction,
      bsdMetadata,
    ] = results.map((r) => (r.status === "fulfilled" ? r.value : null));
  }

  // Build player name map from lineups so player-stats can show names
  const playerNameMap: Record<
    number,
    { name: string; position: string; team: "home" | "away" }
  > = {};
  if ((bsdLineups as any)?.lineups) {
    const lin = (bsdLineups as any).lineups;
    for (const side of ["home", "away"] as const) {
      for (const p of [
        ...(lin[side]?.players ?? []),
        ...(lin[side]?.substitutes ?? []),
      ]) {
        playerNameMap[p.id] = {
          name: p.short_name ?? p.name,
          position: p.position,
          team: side,
        };
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-10">
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Calendario
      </Link>

      <MatchDetailTabs
        localMatch={{
          id: match.id,
          homeTeamName: match.homeTeam.name,
          awayTeamName: match.awayTeam.name,
          homeTeamCode: match.homeTeam.code,
          awayTeamCode: match.awayTeam.code,
          homeTeamFlag: match.homeTeam.flag ?? null,
          awayTeamFlag: match.awayTeam.flag ?? null,
          date: match.date,
          stadium: match.stadium,
          city: match.city,
          group: match.group,
          stage: match.stage,
        }}
        currentScore={
          dbScore ? { home: dbScore.homeScore, away: dbScore.awayScore } : null
        }
        userPrediction={
          userPrediction
            ? {
                homeScore: userPrediction.homeScore,
                awayScore: userPrediction.awayScore,
              }
            : null
        }
        bsd={{
          status: (bsdCore as any)?.status ?? null,
          period: (bsdCore as any)?.period ?? null,
          currentMinute: (bsdCore as any)?.current_minute ?? null,
          homeScoreHt: (bsdCore as any)?.home_score_ht ?? null,
          awayScoreHt: (bsdCore as any)?.away_score_ht ?? null,
          stats: bsdStats as any,
          incidents: (bsdIncidents as any)?.incidents ?? null,
          lineups: bsdLineups as any,
          playerStats: (bsdPlayerStats as any)?.player_stats ?? null,
          playerNameMap,
          odds: (bsdOdds as any)?.odds ?? null,
          prediction: bsdPrediction as any,
          metadata: bsdMetadata as any,
        }}
      />
    </div>
  );
}
