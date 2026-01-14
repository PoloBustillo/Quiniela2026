import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KnockoutMatchManager } from "@/components/admin/KnockoutMatchManager";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // @ts-ignore
  if (session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona partidos eliminatorios y resultados del mundial
          </p>
        </div>
        <Badge variant="destructive" className="w-fit">
          Admin
        </Badge>
      </div>

      <KnockoutMatchManager />
    </div>
  );
}
