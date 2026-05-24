/**
 * Vercel Cron Job — BSD Live Sync
 *
 * Endpoint: GET /api/cron/sync-bsd
 *
 * Configurado en vercel.json para ejecutarse cada minuto durante
 * las horas de partidos del Mundial.
 *
 * Seguridad: protegido por CRON_SECRET (Vercel lo inyecta automáticamente
 * en el header Authorization cuando lo llama el cron scheduler).
 *
 * Si BSD falla → retorna 200 igualmente (el cron no debe reintentar por errores BSD).
 */

import { NextResponse } from "next/server";
import { syncLiveMatches } from "@/lib/bsd-sync";

export async function GET(request: Request) {
  // Verificar CRON_SECRET si está configurado
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  // BSD sync — nunca lanza, siempre retorna resultado
  const result = await syncLiveMatches();

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    result,
  });
}
