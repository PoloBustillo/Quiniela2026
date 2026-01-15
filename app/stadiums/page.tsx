import { MapPin, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import stadiumsData from "@/data/stadiums.json";

export default function StadiumsPage() {
  const stadiums = stadiumsData.stadiums;

  // Agrupar por país
  const stadiumsByCountry = stadiums.reduce((acc, stadium) => {
    if (!acc[stadium.country]) {
      acc[stadium.country] = [];
    }
    acc[stadium.country].push(stadium);
    return acc;
  }, {} as Record<string, typeof stadiums>);

  const totalCapacity = stadiums.reduce((sum, s) => sum + s.capacity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-500" />
            Estadios del Mundial 2026
          </h1>
          <p className="text-muted-foreground mt-2">
            Sedes oficiales de la Copa Mundial de la FIFA 2026
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            {stadiums.length} estadios
          </Badge>
          <Badge variant="outline" className="w-fit">
            {Object.keys(stadiumsByCountry).length} países
          </Badge>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Total Estadios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stadiums.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacidad Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalCapacity.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Países Sede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.keys(stadiumsByCountry).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de estadios por país */}
      <div className="space-y-6">
        {Object.entries(stadiumsByCountry).map(([country, countryStadiums]) => (
          <div key={country}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">{country}</h2>
              <Badge variant="secondary">
                {countryStadiums.length}{" "}
                {countryStadiums.length === 1 ? "estadio" : "estadios"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countryStadiums.map((stadium) => (
                <Card
                  key={stadium.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{stadium.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {stadium.city}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Capacidad
                      </span>
                      <Badge variant="outline">
                        {stadium.capacity.toLocaleString()} personas
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Zona Horaria
                      </span>
                      <span className="text-sm font-mono">
                        {stadium.timezone.split("/")[1]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de ciudades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Todas las Ciudades Sede
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(stadiums.map((s) => s.city)))
              .sort()
              .map((city) => (
                <Badge key={city} variant="secondary" className="text-sm">
                  {city}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
