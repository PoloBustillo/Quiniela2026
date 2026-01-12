import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp, BarChart3, Activity, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            Mis Estadísticas
          </h1>
          <p className="text-muted-foreground mt-2">
            Analiza tu desempeño y mejora tus predicciones
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Activity className="h-3 w-3 mr-1" />
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
            Tus estadísticas detalladas estarán disponibles muy pronto. Verás tu
            precisión, puntos totales, racha y más.
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Precisión</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Racha</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Gráficas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
