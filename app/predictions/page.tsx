import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Target, Clock, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PredictionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Mis Predicciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Haz tus predicciones antes de que inicie cada partido
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Clock className="h-3 w-3 mr-1" />
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
            La funcionalidad de predicciones estará disponible muy pronto. Aquí
            podrás hacer tus predicciones para todos los partidos del mundial.
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              Fase de grupos
            </Badge>
            <Badge variant="outline">Octavos</Badge>
            <Badge variant="outline">Cuartos</Badge>
            <Badge variant="outline">Semifinales</Badge>
            <Badge variant="outline">Final</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
