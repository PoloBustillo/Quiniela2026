import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Settings2, Bell, Shield, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            Configuraciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra tu cuenta y preferencias
          </p>
        </div>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Image
              src={session.user?.image || ""}
              alt={session.user?.name || ""}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold text-lg">{session.user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {session.user?.email}
              </p>
              <Badge variant="secondary" className="mt-1">
                {/* @ts-ignore */}
                {session.user?.role === "ADMIN" ? "Administrador" : "Usuario"}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Conectado con Google</p>
            <p className="text-xs text-muted-foreground">
              Tu cuenta está sincronizada con Google OAuth
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Controla cómo recibes actualizaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recordatorios de partidos</p>
              <p className="text-sm text-muted-foreground">
                Te avisamos antes de que inicie cada partido
              </p>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resultados y puntos</p>
              <p className="text-sm text-muted-foreground">
                Notificación cuando se actualizan tus puntos
              </p>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cambios en la tabla</p>
              <p className="text-sm text-muted-foreground">
                Te avisamos cuando cambias de posición
              </p>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidad y Seguridad
          </CardTitle>
          <CardDescription>Controla tu información y seguridad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Visibilidad del perfil</p>
            <p className="text-sm text-muted-foreground">
              Tu perfil es visible para todos los participantes de la quiniela
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">Datos recopilados</p>
            <p className="text-sm text-muted-foreground">
              Solo guardamos tu información de Google (nombre, email, foto) y
              tus predicciones
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium text-destructive">Eliminar cuenta</p>
            <p className="text-sm text-muted-foreground">
              Si deseas eliminar tu cuenta y todos tus datos, contacta al
              administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
