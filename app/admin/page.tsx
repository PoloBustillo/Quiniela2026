import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Calendar, Trophy, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // @ts-ignore
  if (session.user?.role !== "ADMIN") {
    redirect("/");
  }

  const adminActions = [
    {
      icon: Calendar,
      title: "Gestionar Partidos",
      description: "Crear y editar partidos del mundial",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Trophy,
      title: "Actualizar Resultados",
      description: "Ingresar resultados de partidos finalizados",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Globe,
      title: "Gestionar Equipos",
      description: "Agregar y editar selecciones participantes",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona partidos, resultados y equipos del mundial
          </p>
        </div>
        <Badge variant="destructive" className="w-fit">
          Admin
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {adminActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Card
              key={i}
              className="hover:scale-105 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div
                  className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} w-fit mb-2`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-card to-accent/20 border-dashed">
        <CardHeader>
          <CardTitle>🚧 En Desarrollo</CardTitle>
          <CardDescription>
            Las funcionalidades de administración estarán disponibles
            próximamente
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
