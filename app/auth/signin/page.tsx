"use client";

import { signIn } from "next-auth/react";
import { Chrome, Trophy, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        <Card className="border-2">
          <CardHeader className="space-y-4 text-center pb-4">
            <div className="flex justify-center gap-2 text-5xl mb-2">
              <span>⚽</span>
              <span>🏆</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-400 to-green-400 bg-clip-text text-transparent">
                Quiniela Mundial 2026
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Inicia sesión para comenzar a hacer tus predicciones
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Sign In Button */}
            <Button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full h-12 text-base font-semibold gap-3"
              size="lg"
            >
              <Chrome className="h-5 w-5" />
              Continuar con Google
            </Button>

            <Separator />

            {/* Mundial Info */}
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-3 text-2xl">
                <span>🇺🇸</span>
                <span>🇲🇽</span>
                <span>🇨🇦</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Estados Unidos • México • Canadá
              </p>
              <p className="text-xs text-muted-foreground">
                📅 11 Junio - 19 Julio 2026
              </p>
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Target, label: "Predicciones" },
                { icon: Trophy, label: "Rankings" },
                { icon: TrendingUp, label: "Estadísticas" },
                { icon: Users, label: "Compite" },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{feature.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Hecho con ⚽ para el Mundial 2026
        </p>
      </div>
    </div>
  );
}
