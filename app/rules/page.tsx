import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Info, Trophy, Award } from "lucide-react";
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
                <span className="font-semibold">Diferencia de Goles</span>
                <Badge className="bg-blue-600">3 puntos</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Aciertas ganador y diferencia (ej: predices 2-0, sale 3-1)
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ganador</span>
                <Badge className="bg-yellow-600">1 punto</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Solo aciertas quién gana (cualquier marcador)
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
        </CardContent>
      </Card>

      {/* Reglas Generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Reglas Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="text-2xl">1️⃣</div>
            <div>
              <p className="font-semibold">Fecha Límite</p>
              <p className="text-sm text-muted-foreground">
                Las predicciones deben hacerse antes del inicio de cada partido
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-2xl">2️⃣</div>
            <div>
              <p className="font-semibold">Fase de Grupos</p>
              <p className="text-sm text-muted-foreground">
                Se pueden pronosticar empates. Sistema de puntos estándar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-2xl">3️⃣</div>
            <div>
              <p className="font-semibold">Fase Eliminatoria</p>
              <p className="text-sm text-muted-foreground">
                Los empates se definen por penales. Si predices empate en 90 min
                y aciertas, ganas puntos extra.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-2xl">4️⃣</div>
            <div>
              <p className="font-semibold">Tabla de Posiciones</p>
              <p className="text-sm text-muted-foreground">
                Se actualiza automáticamente después de cada partido
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premios */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Premios
          </CardTitle>
          <CardDescription>¿Qué ganas al participar?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
            <div className="text-3xl">🥇</div>
            <div>
              <p className="font-semibold text-lg">1er Lugar</p>
              <p className="text-sm text-muted-foreground">Premio a definir</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="text-3xl">🥈</div>
            <div>
              <p className="font-semibold text-lg">2do Lugar</p>
              <p className="text-sm text-muted-foreground">Premio a definir</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="text-3xl">🥉</div>
            <div>
              <p className="font-semibold text-lg">3er Lugar</p>
              <p className="text-sm text-muted-foreground">Premio a definir</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
