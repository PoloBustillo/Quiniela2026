import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import matchesData from "@/data/matches.json";
import teamsData from "@/data/teams.json";

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Crear un mapa de equipos para acceso rápido
  const teamsMap = teamsData.teams.reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {} as Record<string, any>);

  // Agrupar partidos por fecha
  const matchesByDate = matchesData.matches.reduce((acc, match) => {
    const date = new Date(match.date).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Calendario de Partidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Todos los partidos de la fase de grupos
          </p>
        </div>
      </div>

      {/* Matches by Date */}
      <div className="space-y-8">
        {Object.entries(matchesByDate).map(([date, matches]) => (
          <div key={date} className="space-y-4">
            <div className="sticky top-16 z-10 bg-background/95 backdrop-blur py-2 border-b">
              <h2 className="text-xl font-semibold capitalize">{date}</h2>
              <p className="text-sm text-muted-foreground">
                {matches.length} {matches.length === 1 ? "partido" : "partidos"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} teams={teamsMap} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
