import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Info, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RulesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Reglas de la Quiniela
          </h1>
          <p className="text-muted-foreground mt-2">
            Conoce cómo funciona el sistema de puntos y las reglas del juego
          </p>
        </div>
      </div>

      {/* Sistema de Puntos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sistema de Puntos
          </CardTitle>
          <CardDescription>
            Así es como se calculan tus puntos en cada partido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Resultado Exacto</span>
                <Badge className="bg-green-600">5 puntos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Aciertas el marcador exacto (ej: 2-1)
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ganador Correcto</span>
                <Badge className="bg-blue-600">3 puntos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Aciertas el ganador pero no el marcador exacto
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Empate Acertado</span>
                <Badge className="bg-yellow-600">1 punto</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Aciertas que fue empate (cualquier marcador)
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Predicción Incorrecta</span>
                <Badge variant="destructive">0 puntos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                No aciertas el resultado
              </p>
            </div>
          </div>

          {/* Nota importante */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Nota Importante
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Los marcadores a predecir son{" "}
                  <strong>sin tiempo extra ni penales</strong>. Solo cuenta el
                  resultado al final de los 90 minutos de juego regular.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
