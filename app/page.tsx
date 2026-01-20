import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import matchesData from "@/data/matches.json";
import ClientHomePage from "@/components/ClientHomePage";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Get user's existing predictions
  const predictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
    },
  });

  // Get group stage matches with scores and custom dates from DB
  const groupScores = await prisma.groupMatchScore.findMany();
  const groupScoresMap = groupScores.reduce(
    (acc, score) => {
      acc[score.matchId] = {
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        matchDate: score.matchDate,
      };
      return acc;
    },
    {} as Record<
      number,
      {
        homeScore: number | null;
        awayScore: number | null;
        matchDate: Date | null;
      }
    >,
  );

  // Combine group matches from JSON with scores/dates from DB
  const groupMatches = matchesData.matches.map((match: any) => {
    const score = groupScoresMap[match.id];
    let dateToUse = match.date;

    // Si hay una fecha personalizada en BD, usarla
    if (score?.matchDate) {
      // Formatear como "YYYY-MM-DD HH:MM:SS-06" (formato México)
      const year = score.matchDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        year: "numeric",
      });
      const month = score.matchDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        month: "2-digit",
      });
      const day = score.matchDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        day: "2-digit",
      });
      const hour = score.matchDate
        .toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          hour: "2-digit",
          hour12: false,
        })
        .padStart(2, "0");
      const minute = score.matchDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        minute: "2-digit",
      });

      dateToUse = `${year}-${month}-${day} ${hour}:${minute}:00-06`;
    }

    return {
      ...match,
      date: dateToUse,
      homeScore: score?.homeScore ?? null,
      awayScore: score?.awayScore ?? null,
    };
  });

  // Get knockout matches from database
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

  // Transform knockout matches to match the expected format
  const formattedKnockoutMatches = knockoutMatches.map((match, index) => ({
    id: 1000 + index, // Use IDs starting from 1000 to avoid conflicts with group stage
    matchNumber: 1000 + index,
    homeTeam: {
      id: 1000 + index, // Simple numeric ID for frontend
      name: match.homeTeam.name,
      code: match.homeTeam.code,
      flag: match.homeTeam.flag || "/flags/tbd.png",
    },
    awayTeam: {
      id: 1000 + index, // Simple numeric ID for frontend
      name: match.awayTeam.name,
      code: match.awayTeam.code,
      flag: match.awayTeam.flag || "/flags/tbd.png",
    },
    date: match.matchDate.toISOString(),
    stadium: match.stadium || "Por definir",
    city: match.city || "Por definir",
    country: "",
    stage: match.phase,
    phase: match.phase,
    group: "", // No group for knockout matches
  }));

  // Combine group stage matches (with DB data) with knockout matches from DB
  const allMatches = [...groupMatches, ...formattedKnockoutMatches];

  // Create a map of predictions by matchId for easy lookup
  const predictionMap = predictions.reduce(
    (acc, pred) => {
      // Extract the numeric match ID from the stored string (e.g., "match_1" -> 1)
      // Handle both "match_X" format (group stage) and numeric IDs (knockout)
      let matchId: number;
      if (pred.matchId.startsWith("match_")) {
        matchId = parseInt(pred.matchId.replace("match_", ""));
      } else {
        matchId = parseInt(pred.matchId);
      }
      acc[matchId] = {
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
      };
      return acc;
    },
    {} as Record<number, { homeScore: number; awayScore: number }>,
  );

  const totalPredictions = predictions.length;
  const totalPoints = predictions.reduce((sum, p) => sum + p.points, 0);

  return (
    <ClientHomePage
      matches={allMatches}
      predictionMap={predictionMap}
      totalPredictions={totalPredictions}
      totalPoints={totalPoints}
    />
  );
}
