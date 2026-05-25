/**
 * External Cron Trigger — BSD Live Sync
 *
 * Endpoint: GET /api/cron/sync-bsd
 *
 * Debe ser llamado por un scheduler externo (Railway/Render/GitHub Actions/cron-job.org)
 * para planes Vercel Hobby donde no se permite frecuencia alta de cron.
 *
 * Seguridad: protegido por CRON_SECRET vía header Authorization: Bearer <secret>.
 *
 * Si BSD falla → retorna 200 igualmente (el scheduler no debe reintentar por errores BSD).
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
