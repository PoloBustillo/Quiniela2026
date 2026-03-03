import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Info, Trophy, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Reglas de la Quiniela
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Mundial 2026</p>
      </div>

      {/* Sistema de Puntos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Sistema de Puntos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Score tiles */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-green-500/5 border-green-500/30">
              <span className="text-3xl font-black text-green-600">5</span>
              <span className="text-[11px] font-semibold text-center leading-tight">Marcador exacto</span>
              <span className="text-[10px] text-muted-foreground text-center">ej: predices 2-1, cae 2-1</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-blue-500/5 border-blue-500/30">
              <span className="text-3xl font-black text-blue-600">3</span>
              <span className="text-[11px] font-semibold text-center leading-tight">Ganador o empate</span>
              <span className="text-[10px] text-muted-foreground text-center">ej: predices 3-0, cae 2-0</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-muted/50">
              <span className="text-3xl font-black text-muted-foreground">0</span>
              <span className="text-[11px] font-semibold text-center leading-tight">Fallo</span>
              <span className="text-[10px] text-muted-foreground text-center">ej: predices 1-0, cae 0-1</span>
            </div>
          </div>

          {/* Examples table */}
          <div className="rounded-lg border overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <span>Resultado real</span>
              <span>Tu predicción</span>
              <span className="text-right">Puntos</span>
            </div>
            {[
              { real: "2 – 1", pred: "2 – 1", pts: 5, color: "text-green-600" },
              { real: "2 – 1", pred: "3 – 0", pts: 3, color: "text-blue-600" },
              { real: "1 – 1", pred: "2 – 2", pts: 3, color: "text-blue-600" },
              { real: "2 – 1", pred: "0 – 1", pts: 0, color: "text-muted-foreground" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-2 border-t text-sm">
                <span className="font-mono font-semibold">{row.real}</span>
                <span className="font-mono text-muted-foreground">{row.pred}</span>
                <span className={`text-right font-bold ${row.color}`}>+{row.pts}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-lg text-xs">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800 dark:text-blue-200">
              Solo cuenta el resultado al final de los <strong>90 minutos</strong>. Sin tiempo extra ni penales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inscripciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Inscripción por Fases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { fase: "Fase de Grupos", precio: "$100", desc: "Partidos del grupo A al H" },
            { fase: "32avos + 16avos", precio: "$100", desc: "Primera y segunda ronda eliminatoria" },
            { fase: "Cuartos · Semis · Final", precio: "$100", desc: "Fases finales del torneo" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{item.fase}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Badge variant="secondary" className="text-base font-bold px-3">{item.precio}</Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Puedes inscribirte en una, dos o las tres fases. Cada fase es independiente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
