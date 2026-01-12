import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Target,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const quickActions = [
    {
      href: "/predictions",
      icon: Target,
      title: "Mis Predicciones",
      description: "Realiza tus predicciones para los próximos partidos",
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      title: "Tabla de Posiciones",
      description: "Revisa cómo vas en el ranking general",
      color: "from-green-500 to-green-600",
    },
    {
      href: "/stats",
      icon: TrendingUp,
      title: "Mis Estadísticas",
      description: "Analiza tu desempeño y precisión",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const pointsSystem = [
    { points: 5, label: "Resultado exacto", color: "bg-green-500" },
    { points: 3, label: "Ganador correcto", color: "bg-blue-500" },
    { points: 1, label: "Empate acertado", color: "bg-yellow-500" },
    { points: 0, label: "Predicción incorrecta", color: "bg-muted" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-6 md:py-12">
        <div className="flex items-center justify-center gap-2 text-5xl md:text-6xl mb-4">
          <span>🏆</span>
          <span>⚽</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-blue-400 to-green-400 bg-clip-text text-transparent">
          Mundial 2026
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          ¡Bienvenido a la Quiniela del Mundial! Haz tus predicciones y compite
          con tus amigos.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Hola, {session.user?.name?.split(" ")[0] || "Usuario"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[
          {
            icon: "⚽",
            value: "48",
            label: "Partidos",
            color: "text-blue-500",
          },
          {
            icon: "🌎",
            value: "48",
            label: "Selecciones",
            color: "text-green-500",
          },
          {
            icon: "🏟️",
            value: "16",
            label: "Estadios",
            color: "text-purple-500",
          },
          {
            icon: "👥",
            value: "0",
            label: "Participantes",
            color: "text-orange-500",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="text-center hover:scale-105 transition-transform"
          >
            <CardContent className="pt-6 pb-5 px-3">
              <div className="text-3xl md:text-4xl mb-2">{stat.icon}</div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="group">
              <Card className="h-full hover:scale-105 transition-all duration-200 hover:shadow-xl">
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
                <CardContent className="pb-5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start group-hover:bg-accent"
                  >
                    Ver más →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Points System */}
      <Card className="bg-gradient-to-br from-card to-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sistema de Puntos
          </CardTitle>
          <CardDescription>Conoce cómo se calculan tus puntos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {pointsSystem.map((item, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-4 text-center border border-border"
              >
                <div
                  className={`text-3xl md:text-4xl font-bold mb-1 ${
                    item.color === "bg-muted" ? "text-muted-foreground" : ""
                  }`}
                >
                  {item.points}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mundial Info */}
      <Card className="bg-gradient-to-br from-primary/10 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Calendar className="h-5 w-5" />
            Mundial 2026
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-3xl">
            <span>🇺🇸</span>
            <span>🇲🇽</span>
            <span>🇨🇦</span>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Estados Unidos • México • Canadá
          </p>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-bold text-base md:text-lg">11 Jun</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Inicio
              </div>
            </div>
            <div>
              <div className="font-bold text-base md:text-lg">19 Jul</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Final
              </div>
            </div>
            <div>
              <div className="font-bold text-base md:text-lg">104</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Partidos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
