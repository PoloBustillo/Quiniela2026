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

  // Combine group stage matches from JSON with knockout matches from DB
  const allMatches = [...matchesData.matches, ...formattedKnockoutMatches];

  // Create a map of predictions by matchId for easy lookup
  const predictionMap = predictions.reduce((acc, pred) => {
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
  }, {} as Record<number, { homeScore: number; awayScore: number }>);

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
