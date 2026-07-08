import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import matchesData from "@/data/matches.json";
import { parseMatchDate } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Obtener fechas override y resultados de la DB
  const groupDateOverrides = await prisma.groupMatchScore.findMany({
    select: { matchId: true, matchDate: true },
  });
  const groupDateOverrideMap = new Map(
    groupDateOverrides.map((m) => [m.matchId, m.matchDate]),
  );

  const now = new Date();

  // Filtrar partidos de grupos: ocultar solo 3h después de que empezaron
  const groupMatches = matchesData.matches
    .filter(m => {
      const overrideDate = groupDateOverrideMap.get(m.id);
      const matchDate = overrideDate || parseMatchDate(m.date);
      return matchDate.getTime() + 3 * 60 * 60 * 1000 > now.getTime();
    })
    .map((match) => {
    const overrideDate = groupDateOverrideMap.get(match.id);
    if (overrideDate) {
      // Formatear como el JSON: "YYYY-MM-DD HH:MM:SS-06"
      const year = overrideDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        year: "numeric",
      });
      const month = overrideDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        month: "2-digit",
      });
      const day = overrideDate.toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        day: "2-digit",
      });
      const hour = overrideDate
        .toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          hour: "2-digit",
          hour12: false,
        })
        .padStart(2, "0");
      const minute = overrideDate
        .toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          minute: "2-digit",
        })
        .padStart(2, "0");
      return {
        ...match,
        date: `${year}-${month}-${day} ${hour}:${minute}:00-06`,
      };
    }
    return match;
  });

  // Cargar partidos de eliminatorias (16vos, 8vos, etc.)
  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: {
        in: ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"],
      },
      OR: [
        { status: "SCHEDULED" },
        { status: "LIVE" },
        { status: "FINISHED" },
      ],
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      matchDate: "asc",
    },
  });

  const PHASE_LABELS: Record<string, string> = {
    ROUND_OF_32: "16vos de Final",
    ROUND_OF_16: "8vos de Final",
    QUARTER_FINAL: "Cuartos de Final",
    SEMI_FINAL: "Semifinal",
    THIRD_PLACE: "3er Lugar",
    FINAL: "Final",
  };

  // Mapear knockout matches al formato que espera MatchCard
  const knockoutFormatted = knockoutMatches.map(m => ({
    id: m.id,
    matchNumber: 0,
    date: m.matchDate.toISOString(),
    stadium: m.stadium ?? "",
    city: m.city ?? "",
    country: "",
    group: "",
    stage: PHASE_LABELS[m.phase] ?? m.phase,
    phase: m.phase,
    homeTeam: {
      id: m.homeTeam?.id ?? "",
      name: m.homeTeam?.name ?? "TBD",
      code: m.homeTeam?.code ?? "",
      flag: m.homeTeam?.flag ?? "/flags/tbd.png",
    },
    awayTeam: {
      id: m.awayTeam?.id ?? "",
      name: m.awayTeam?.name ?? "TBD",
      code: m.awayTeam?.code ?? "",
      flag: m.awayTeam?.flag ?? "/flags/tbd.png",
    },
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  // Mostrar solo fases finales a partir de cuartos
  const allMatches = [...knockoutFormatted];

  // Agrupar partidos por fecha (usando timezone de México)
  const matchesByDate = allMatches.reduce(
    (acc, match) => {
      const date = parseMatchDate(match.date).toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Mexico_City",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(match);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const hasKnockout = knockoutMatches.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Calendario de Partidos
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasKnockout
              ? "Fases Finales del Mundial 2026"
              : "No hay partidos programados"}
          </p>
        </div>
      </div>

      {/* Matches by Date */}
      <div className="space-y-8">
        {Object.keys(matchesByDate).length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-lg font-semibold text-muted-foreground">
              {hasKnockout
                ? "No hay partidos programados"
                : "La fase de grupos ha terminado"}
            </p>
            <p className="text-sm text-muted-foreground/60">
              Próximamente: 16vos de Final
            </p>
          </div>
        ) : (
          Object.entries(matchesByDate).map(([date, matches]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-16 z-10 bg-background/95 backdrop-blur py-2 border-b">
                <h2 className="text-xl font-semibold capitalize">{date}</h2>
                <p className="text-sm text-muted-foreground">
                  {matches.length} {matches.length === 1 ? "partido" : "partidos"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match as any} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
