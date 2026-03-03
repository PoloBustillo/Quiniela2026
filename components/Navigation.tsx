"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Trophy,
  BookOpen,
  Settings,
  LogOut,
  Calendar,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session || pathname.startsWith("/auth")) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  // @ts-ignore
  const isAdmin = session?.user?.role === "ADMIN";

  const navLinks = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/leaderboard", icon: Trophy, label: "Tabla" },
    { href: "/rules", icon: BookOpen, label: "Reglas" },
  ];

  if (isAdmin) {
    navLinks.push({ href: "/admin", icon: Settings, label: "Admin" });
  }

  return (
    <>
      {/* Top bar — desktop only */}
      <nav className="hidden md:flex sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-2xl">⚽</span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Quiniela 2026
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-[120px] truncate">{session.user?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile top bar — logo only */}
      <div className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5 font-bold">
            <span className="text-xl">⚽</span>
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent text-base">
              Quiniela 2026
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
              <AvatarFallback className="text-xs">{session.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch h-14">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom spacer so content clears the tab bar on mobile */}
      <div className="md:hidden h-14" aria-hidden />
    </>
  );
}
