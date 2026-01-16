"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Trophy,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session || pathname.startsWith("/auth")) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  // @ts-ignore
  const isAdmin = session?.user?.role === "ADMIN";

  const navLinks = [
    { href: "/", icon: Calendar, label: "Partidos" },
    { href: "/rules", icon: BookOpen, label: "Reglas" },
    { href: "/leaderboard", icon: Trophy, label: "Tabla" },
  ];

  if (isAdmin) {
    navLinks.push({ href: "/admin", icon: Settings, label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 font-bold text-base sm:text-lg md:text-xl"
          >
            <span className="text-2xl sm:text-3xl">⚽</span>
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Mundial 2026</span>
              <span className="sm:hidden">Mundial</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={session.user?.image || ""}
                  alt={session.user?.name || "User"}
                />
                <AvatarFallback>
                  {session.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 animate-slide-down">
            <Separator className="mb-2" />
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors",
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              <Separator className="my-2" />
              <div className="flex items-center gap-3 px-4 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={session.user?.image || ""}
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session.user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="justify-start gap-3 px-4 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
