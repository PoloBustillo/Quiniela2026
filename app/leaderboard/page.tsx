import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy, Medal, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Tabla de Posiciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Compite con otros usuarios y sube en el ranking
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Medal className="h-3 w-3 mr-1" />
          Próximamente
        </Badge>
      </div>

      <Card className="text-center py-16 border-dashed">
        <CardContent className="space-y-4">
          <div className="text-7xl mb-4">🏗️</div>
          <CardTitle className="text-2xl md:text-3xl">
            En Construcción
          </CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            La tabla de posiciones estará disponible muy pronto. Aquí verás el
            ranking de todos los participantes ordenados por puntos.
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">1er Lugar</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <Medal className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">2do Lugar</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Award className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">3er Lugar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
