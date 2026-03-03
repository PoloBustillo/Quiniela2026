"use client";

import { signIn } from "next-auth/react";
import { Chrome, Trophy, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
      <div className="w-full max-w-sm space-y-6">

        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-1">⚽</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-400 to-green-400 bg-clip-text text-transparent">
            Quiniela Mundial 2026
          </h1>
          <p className="text-sm text-muted-foreground">
            🇺🇸 Estados Unidos · 🇲🇽 México · 🇨🇦 Canadá
          </p>
          <p className="text-xs text-muted-foreground">📅 11 Jun – 19 Jul 2026</p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Target, label: "Predice" },
            { icon: Trophy, label: "Rankings" },
            { icon: TrendingUp, label: "Stats" },
            { icon: Users, label: "Compite" },
          ].map(({ icon: Icon, label }) => (
            <div key={label}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-accent/50 text-center">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full h-12 text-base font-semibold gap-3"
          size="lg"
        >
          <Chrome className="h-5 w-5" />
          Continuar con Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Hecho con ⚽ para el Mundial 2026
        </p>
      </div>
    </div>
  );
}
