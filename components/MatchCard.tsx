"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";

interface Team {
  id: string;
  name: string;
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
  homeTeam: string;
  awayTeam: string;
  phase: string;
  round: number;
}

interface MatchCardProps {
  match: Match;
  teams: Record<string, Team>;
}

export function MatchCard({ match, teams }: MatchCardProps) {
  const homeTeam = teams[match.homeTeam];
  const awayTeam = teams[match.awayTeam];

  const matchDate = new Date(match.date);

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
    timeZone: "America/Mexico_City",
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Partido {match.matchNumber}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Grupo {match.group}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teams */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-12">
              <Image
                src={homeTeam?.flag || "/flags/tbd.png"}
                alt={homeTeam?.name || "TBD"}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-center">
              {homeTeam?.name || "TBD"}
            </p>
          </div>

          {/* VS */}
          <div className="text-2xl font-bold text-muted-foreground">vs</div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-12">
              <Image
                src={awayTeam?.flag || "/flags/tbd.png"}
                alt={awayTeam?.name || "TBD"}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-center">
              {awayTeam?.name || "TBD"}
            </p>
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
      </CardContent>
    </Card>
  );
}
