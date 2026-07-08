"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { parseMatchDate } from "@/lib/points";
import { getPlayerForTeam } from "@/lib/team-players";
import SideFigure from "@/components/SideFigure";

interface MatchTeam {
  id: number;
  name: string;
  code: string;
  flag: string;
}

interface Match {
  id: number;
  matchNumber: number;
  date: string;
  stadium: string;
  city: string;
  country: string;
  group: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  stage: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;

  const matchDate = parseMatchDate(match.date);

  // Formatear fecha en zona horaria de Ciudad de México (CST/UTC-6)
  const dateStr = matchDate.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  });

  const timeStr = matchDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Mexico_City",
  });

  const isFinished =
    match.homeScore != null &&
    match.awayScore != null;

  const visualWinner = isFinished
    ? match.homeScore! > match.awayScore!
      ? "home"
      : match.awayScore! > match.homeScore!
        ? "away"
        : "draw"
    : null;

  const homePlayerSrc = getPlayerForTeam(homeTeam);
  const awayPlayerSrc = getPlayerForTeam(awayTeam);

  return (
    <Link href={`/matches/${match.id}`} className="block group">
      <Card className="hover:shadow-lg hover:border-primary/40 transition-all group-hover:scale-[1.01] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {match.matchNumber > 0 ? (
              <Badge variant="secondary" className="text-xs">
                Partido {match.matchNumber}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {match.stage}
              </Badge>
            )}
            {match.group && (
              <Badge variant="outline" className="text-xs">
                Grupo {match.group}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Teams */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2">
              <SideFigure
                team={homeTeam}
                playerSrc={homePlayerSrc}
                side="home"
                visualWinner={visualWinner}
                className="h-32 w-24 sm:h-36 sm:w-28 md:h-40 md:w-32"
                sizes="(max-width: 640px) 128px, 160px"
              />
              <p className="text-sm font-semibold text-center">
                {homeTeam?.name || "TBD"}
              </p>
              {isFinished && (
                <p className="text-lg font-bold text-foreground">
                  {match.homeScore}
                </p>
              )}
            </div>

            {/* VS */}
            <div className="text-2xl font-bold text-muted-foreground">vs</div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2">
              <SideFigure
                team={awayTeam}
                playerSrc={awayPlayerSrc}
                side="away"
                visualWinner={visualWinner}
                className="h-32 w-24 sm:h-36 sm:w-28 md:h-40 md:w-32"
                sizes="(max-width: 640px) 128px, 160px"
              />
              <p className="text-sm font-semibold text-center">
                {awayTeam?.name || "TBD"}
              </p>
              {isFinished && (
                <p className="text-lg font-bold text-foreground">
                  {match.awayScore}
                </p>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{dateStr}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{timeStr}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">
                {match.stadium}, {match.city}
              </span>
            </div>
          </div>
          <div className="pt-1 text-right">
            <span className="text-xs text-primary font-medium">
              Ver partido →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
