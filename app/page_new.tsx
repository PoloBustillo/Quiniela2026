import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PredictionCard from "@/components/PredictionCard";
import { prisma } from "@/lib/prisma";
import matchesData from "@/data/matches.json";

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

  // Create a map of predictions by matchId for easy lookup
  const predictionMap = predictions.reduce((acc, pred) => {
    // Extract the numeric match ID from the stored string (e.g., "match_1" -> 1)
    const matchId = parseInt(pred.matchId.replace("match_", ""));
    acc[matchId] = {
      homeScore: pred.homeScore,
      awayScore: pred.awayScore,
    };
    return acc;
  }, {} as Record<number, { homeScore: number; awayScore: number }>);

  // Group matches by date
  const matchesByDate = matchesData.matches.reduce((acc, match) => {
    const date = new Date(match.date).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, typeof matchesData.matches>);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Tus Predicciones
        </h1>
        <p className="text-muted-foreground">
          Ingresa tus predicciones para cada partido del Mundial 2026
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-2xl font-bold">{predictions.length}</p>
          <p className="text-sm text-muted-foreground">Predicciones</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-2xl font-bold">{matchesData.matches.length}</p>
          <p className="text-sm text-muted-foreground">Partidos Totales</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-2xl font-bold">
            {predictions.reduce((sum, p) => sum + p.points, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Puntos</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-2xl font-bold">
            {Math.round(
              (predictions.length / matchesData.matches.length) * 100
            )}
            %
          </p>
          <p className="text-sm text-muted-foreground">Completado</p>
        </div>
      </div>

      {/* Matches grouped by date */}
      <div className="space-y-8">
        {Object.entries(matchesByDate).map(([date, matches]) => (
          <div key={date}>
            <h2 className="text-xl font-bold mb-4 capitalize">{date}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <PredictionCard
                  key={match.id}
                  match={match}
                  existingPrediction={predictionMap[match.id]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
