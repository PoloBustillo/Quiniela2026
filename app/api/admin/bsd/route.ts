/**
 * Admin API: BSD Sports Sync
 *
 * GET  /api/admin/bsd  → estado del último sync
 * POST /api/admin/bsd  → disparar sync manual
 *
 * Body del POST:
 *   { action: "sync_live" }                    → sync todos los partidos en vivo
 *   { action: "sync_match", matchId: number }  → sync partido de grupos específico
 *   { action: "reset_override", matchId: number, matchType: "group" | "knockout", dbId?: string }
 *                                              → quitar manualOverride de un partido
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  syncLiveMatches,
  syncSingleGroupMatch,
  getLastSyncStatus,
} from "@/lib/bsd-sync";
import { getEventDetail, getLiveMatches } from "@/lib/bsd-client";
import { getBsdEventIdForGroupMatch } from "@/lib/bsd-mapping";
import { prisma } from "@/lib/prisma";

// ── GET — estado del sync ────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    // @ts-ignore
    if (session.user?.role !== "ADMIN")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const logs = await getLastSyncStatus();

    // Contar partidos con manualOverride activo
    const [groupOverrides, knockoutOverrides] = await Promise.all([
      prisma.groupMatchScore.count({ where: { manualOverride: true } }),
      prisma.match.count({ where: { manualOverride: true } }),
    ]);

    return NextResponse.json({
      bsdEnabled: !!process.env.BSD_API_TOKEN,
      recentLogs: logs,
      overrides: {
        groupStage: groupOverrides,
        knockout: knockoutOverrides,
      },
    });
  } catch (err) {
    console.error("[Admin BSD] GET error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST — acciones de sync ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    // @ts-ignore
    if (session.user?.role !== "ADMIN")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await request.json();
    const { action } = body;

    if (action === "sync_live") {
      const result = await syncLiveMatches();
      return NextResponse.json({ success: true, result });
    }

    if (action === "sync_match") {
      const { matchId } = body;
      if (typeof matchId !== "number") {
        return NextResponse.json(
          { error: "matchId requerido (number)" },
          { status: 400 },
        );
      }
      const result = await syncSingleGroupMatch(matchId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "reset_override") {
      const { matchId, matchType, dbId } = body;

      if (matchType === "group" && typeof matchId === "number") {
        await prisma.groupMatchScore.updateMany({
          where: { matchId },
          data: { manualOverride: false },
        });
        return NextResponse.json({
          success: true,
          message: `Override reseteado en partido de grupos #${matchId}`,
        });
      }

      if (matchType === "knockout" && typeof dbId === "string") {
        await prisma.match.update({
          where: { id: dbId },
          data: { manualOverride: false },
        });
        return NextResponse.json({
          success: true,
          message: `Override reseteado en partido eliminatoria ${dbId}`,
        });
      }

      return NextResponse.json(
        { error: "Parámetros inválidos para reset_override" },
        { status: 400 },
      );
    }

    // ── test_connection: verifica token + retorna raw BSD data de un partido ──
    if (action === "test_connection") {
      const matchId = typeof body.matchId === "number" ? body.matchId : 1;
      const bsdEventId = getBsdEventIdForGroupMatch(matchId);
      if (!bsdEventId) {
        return NextResponse.json(
          { error: `Sin mapeo BSD para matchId ${matchId}` },
          { status: 400 },
        );
      }
      const raw = await getEventDetail(bsdEventId);
      return NextResponse.json({
        success: raw !== null,
        bsdEventId,
        localMatchId: matchId,
        raw,
        tokenPresent: !!process.env.BSD_API_TOKEN,
      });
    }

    // ── test_live_any: retorna partidos en vivo SIN filtro de liga (para probar antes del Mundial) ──
    if (action === "test_live_any") {
      const BSD_BASE = "https://sports.bzzoiro.com/api/v2";
      const token = process.env.BSD_API_TOKEN ?? "";
      if (!token)
        return NextResponse.json(
          { error: "BSD_API_TOKEN no configurado" },
          { status: 400 },
        );
      try {
        const res = await fetch(`${BSD_BASE}/events/live/`, {
          headers: { Authorization: `Token ${token}` },
          cache: "no-store",
        });
        const data = res.ok ? await res.json() : null;
        return NextResponse.json({
          success: res.ok,
          httpStatus: res.status,
          data,
        });
      } catch (err) {
        return NextResponse.json({ success: false, error: String(err) });
      }
    }

    return NextResponse.json(
      { error: `Acción desconocida: ${action}` },
      { status: 400 },
    );
  } catch (err) {
    console.error("[Admin BSD] POST error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
