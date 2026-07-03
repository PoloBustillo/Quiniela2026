/**
 * BSD Sports API - Servicio de sincronización
 *
 * FILOSOFÍA:
 * - BSD es una capa de ayuda, NO una dependencia crítica
 * - El sistema manual siempre funciona, aunque BSD falle
 * - Si manualOverride = true, NO se sobrescriben los datos manuales
 * - Todos los errores de BSD se capturan y loggean — nunca se propagan
 *
 * FLUJO:
 *   BSD API → bsd-sync.ts → BD existente (GroupMatchScore / Match)
 *   Admin manual → marca manualOverride=true → sync ignora ese partido
 */

import { prisma } from "@/lib/prisma";
import {
  getLiveMatches,
  getEventDetail,
  bsdStatusToLocal,
  type BsdLiveEvent,
  type BsdEventDetail,
} from "@/lib/bsd-client";
import { getBsdEventIdForGroupMatch } from "@/lib/bsd-mapping";
import { calculatePoints } from "@/lib/points";

// ── Tipos de resultado ───────────────────────────────────────────────────────

export interface SyncResult {
  updated: number;
  skipped: number;
  errors: number;
  details: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getActivePointsRules() {
  return prisma.pointsRule.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { exactScore: true, correctWinner: true, correctDraw: true },
  });
}

async function recalcGroupMatchPredictions(
  matchId: number,
  homeScore: number,
  awayScore: number,
) {
  const rules = await getActivePointsRules();
  const predictionMatchId = `match_${matchId}`;
  const predictions = await prisma.prediction.findMany({
    where: { matchId: predictionMatchId },
  });
  for (const p of predictions) {
    const points = calculatePoints(
      p.homeScore,
      p.awayScore,
      homeScore,
      awayScore,
      rules ?? undefined,
    );
    await prisma.prediction.update({ where: { id: p.id }, data: { points } });
  }
  return predictions.length;
}

async function recalcKnockoutMatchPredictions(
  matchDbId: string,
  homeScore: number,
  awayScore: number,
) {
  const rules = await getActivePointsRules();
  const stableMatchId = `match_${matchDbId}`;
  // Legacy fallback: rows saved before stable-ID migration use match_1000+ format.
  const allKnockoutMatches = await prisma.match.findMany({
    where: { phase: { not: "GROUP_STAGE" } },
    orderBy: { matchDate: "asc" },
    select: { id: true },
  });
  const matchIndex = allKnockoutMatches.findIndex((m) => m.id === matchDbId);
  const legacyMatchId = matchIndex >= 0 ? `match_${1000 + matchIndex}` : null;
  const predictions = await prisma.prediction.findMany({
    where: {
      OR: [
        { matchId: stableMatchId },
        ...(legacyMatchId ? [{ matchId: legacyMatchId }] : []),
      ],
    },
  });
  for (const p of predictions) {
    const points = calculatePoints(
      p.homeScore,
      p.awayScore,
      homeScore,
      awayScore,
      rules ?? undefined,
    );
    await prisma.prediction.update({ where: { id: p.id }, data: { points } });
  }
  return predictions.length;
}

// ── Sincronización de partido de grupos ─────────────────────────────────────

/**
 * Sincroniza un partido de fase de grupos con un evento BSD.
 * Respeta manualOverride. Nunca lanza.
 */
export async function syncGroupMatch(
  localMatchId: number,
  bsdEvent: BsdLiveEvent | BsdEventDetail,
): Promise<"updated" | "skipped" | "error"> {
  try {
    const existing = await prisma.groupMatchScore.findUnique({
      where: { matchId: localMatchId },
    });

    // Respetar override manual
    if (existing?.manualOverride === true) {
      return "skipped";
    }

    const newHomeScore = bsdEvent.home_score;
    const newAwayScore = bsdEvent.away_score;

    // No hay scores todavía en BSD (ambos deben existir)
    if (newHomeScore === null || newAwayScore === null) {
      return "skipped";
    }

    // No sincronizar partidos que aún no han iniciado (BSD a veces retorna 0-0 para notstarted)
    if (bsdEvent.status === "notstarted") {
      return "skipped";
    }

    // Verificar si algo cambió
    const scoresUnchanged =
      existing?.homeScore === newHomeScore &&
      existing?.awayScore === newAwayScore;

    if (scoresUnchanged) return "skipped";

    // Actualizar o crear
    await prisma.groupMatchScore.upsert({
      where: { matchId: localMatchId },
      update: {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        syncSource: "bsd",
        lastSyncedAt: new Date(),
      },
      create: {
        matchId: localMatchId,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        syncSource: "bsd",
        lastSyncedAt: new Date(),
        manualOverride: false,
      },
    });

    // Recalcular puntos en vivo para dar emoción
    if (newHomeScore !== null && newAwayScore !== null) {
      await recalcGroupMatchPredictions(
        localMatchId,
        newHomeScore,
        newAwayScore,
      );
    }

    return "updated";
  } catch (err) {
    console.error(
      `[BSD Sync] Error sincronizando partido de grupos ${localMatchId}:`,
      err,
    );
    return "error";
  }
}

// ── Sincronización de partido de eliminatoria ─────────────────────────────

/**
 * Sincroniza un partido de eliminatoria directa con un evento BSD.
 * Respeta manualOverride. Nunca lanza.
 */
export async function syncKnockoutMatch(
  matchDbId: string,
  bsdEvent: BsdLiveEvent | BsdEventDetail,
): Promise<"updated" | "skipped" | "error"> {
  try {
    const existing = await prisma.match.findUnique({
      where: { id: matchDbId },
    });

    if (!existing) return "skipped";
    if (existing.manualOverride === true) return "skipped";

    const newHomeScore = bsdEvent.home_score;
    const newAwayScore = bsdEvent.away_score;
    const newStatus = bsdStatusToLocal(bsdEvent.status);

    // No sincronizar scores parciales/nulos
    if (newHomeScore === null || newAwayScore === null) {
      return "skipped";
    }

    const scoresUnchanged =
      existing.homeScore === newHomeScore &&
      existing.awayScore === newAwayScore &&
      existing.status === newStatus;

    if (scoresUnchanged) return "skipped";

    await prisma.match.update({
      where: { id: matchDbId },
      data: {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        status: newStatus,
        syncSource: "bsd",
        lastSyncedAt: new Date(),
      },
    });

    if (newHomeScore !== null && newAwayScore !== null) {
      await recalcKnockoutMatchPredictions(
        matchDbId,
        newHomeScore,
        newAwayScore,
      );
    }

    return "updated";
  } catch (err) {
    console.error(
      `[BSD Sync] Error sincronizando partido eliminatoria ${matchDbId}:`,
      err,
    );
    return "error";
  }
}

// ── Sync de partidos en vivo (polling principal) ─────────────────────────────

/**
 * Fuerza la sincronización de un partido de eliminatoria desde su bsdEventId.
 * Ignora manualOverride — para uso exclusivo del admin.
 */
export async function forceSyncKnockoutMatch(
  matchDbId: string,
): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, skipped: 0, errors: 0, details: [] };
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchDbId },
      select: { id: true, bsdEventId: true },
    });

    if (!match?.bsdEventId) {
      result.skipped = 1;
      result.details.push(`Partido ${matchDbId} sin bsdEventId asignado`);
      return result;
    }

    const event = await getEventDetail(match.bsdEventId);
    if (!event) {
      result.errors = 1;
      result.details.push(`Evento BSD ${match.bsdEventId} no encontrado`);
      return result;
    }

    const newHomeScore = event.home_score;
    const newAwayScore = event.away_score;
    const newStatus = bsdStatusToLocal(event.status);

    // No sincronizar scores parciales/nulos ni partidos no iniciados
    if (newHomeScore === null || newAwayScore === null) {
      result.skipped = 1;
      result.details.push(
        `Partido ${matchDbId} sin scores completos en BSD`,
      );
      return result;
    }

    if (event.status === "notstarted") {
      result.skipped = 1;
      result.details.push(
        `Partido ${matchDbId} aún no iniciado en BSD (status: ${event.status})`,
      );
      return result;
    }

    await prisma.match.update({
      where: { id: matchDbId },
      data: {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        status: newStatus,
        syncSource: "bsd",
        lastSyncedAt: new Date(),
      },
    });

    if (newHomeScore !== null && newAwayScore !== null) {
      await recalcKnockoutMatchPredictions(
        matchDbId,
        newHomeScore,
        newAwayScore,
      );
    }

    result.updated = 1;
    result.details.push(
      `Partido ${matchDbId} sincronizado forzosamente: ${newHomeScore}-${newAwayScore} (${event.status})`,
    );
  } catch (err) {
    result.errors = 1;
    result.details.push(`Error: ${String(err)}`);
  }
  return result;
}

/**
 * Sincroniza todos los partidos del Mundial que están en vivo o recién terminados.
 * Cruza los BSD live events con los mapeos locales.
 * Nunca lanza — retorna un SyncResult siempre.
 */
export async function syncLiveMatches(): Promise<SyncResult> {
  const startMs = Date.now();
  const result: SyncResult = { updated: 0, skipped: 0, errors: 0, details: [] };

  try {
    const liveEvents = await getLiveMatches();

    // Construir mapa inverso: bsdEventId → localMatchId (fase de grupos)
    const bsdToLocalGroup = buildBsdToLocalGroupMap();

    // Obtener partidos de eliminatoria con bsdEventId asignado
    const knockoutMatches = await prisma.match.findMany({
      where: { bsdEventId: { not: null } },
      select: { id: true, bsdEventId: true, manualOverride: true },
    });
    const bsdToLocalKnockout = new Map(
      knockoutMatches
        .filter((m) => m.bsdEventId !== null)
        .map((m) => [m.bsdEventId as number, m.id]),
    );

    if (liveEvents.length === 0 && bsdToLocalKnockout.size === 0) {
      result.details.push("No hay partidos del Mundial en vivo actualmente");
      await logSync("live_poll", "ok", result, Date.now() - startMs);
      return result;
    }

    if (liveEvents.length === 0) {
      result.details.push(
        "No hay partidos del Mundial en vivo actualmente; revisando eliminatorias con bsdEventId...",
      );
    }

    // Conjunto de bsdEventIds ya procesados desde el live feed
    const processedBsdIds = new Set<number>();

    for (const event of liveEvents) {
      processedBsdIds.add(event.id);

      // Verificar si es partido de grupos
      const localGroupId = bsdToLocalGroup.get(event.id);
      if (localGroupId !== undefined) {
        const outcome = await syncGroupMatch(localGroupId, event);
        result[
          outcome === "updated"
            ? "updated"
            : outcome === "skipped"
              ? "skipped"
              : "errors"
        ]++;
        if (outcome === "updated") {
          result.details.push(
            `Partido grupos #${localGroupId} actualizado: ${event.home_score}-${event.away_score}`,
          );
        }
        continue;
      }

      // Verificar si es partido de eliminatoria
      const knockoutDbId = bsdToLocalKnockout.get(event.id);
      if (knockoutDbId !== undefined) {
        const outcome = await syncKnockoutMatch(knockoutDbId, event);
        result[
          outcome === "updated"
            ? "updated"
            : outcome === "skipped"
              ? "skipped"
              : "errors"
        ]++;
        if (outcome === "updated") {
          result.details.push(
            `Partido eliminatoria ${knockoutDbId} actualizado: ${event.home_score}-${event.away_score}`,
          );
        }
        continue;
      }

      // BSD event no mapeado → ignorar silenciosamente
      result.skipped++;
    }

    // Para partidos de eliminatoria con bsdEventId explícito que no aparecieron
    // en el live feed (ej. partidos de otra liga usados en pruebas, o partidos
    // que ya terminaron y BSD los quitó del feed en vivo), sincronizar directamente.
    for (const [bsdEventId, knockoutDbId] of bsdToLocalKnockout.entries()) {
      if (processedBsdIds.has(bsdEventId)) continue; // ya procesado arriba

      const event = await getEventDetail(bsdEventId);
      if (!event) {
        result.details.push(
          `Evento BSD ${bsdEventId} no encontrado (eliminatoria ${knockoutDbId})`,
        );
        result.skipped++;
        continue;
      }

      // Solo sincronizar si el partido está en curso o terminado
      if (event.status === "notstarted") {
        result.skipped++;
        continue;
      }

      const outcome = await syncKnockoutMatch(knockoutDbId, event);
      result[
        outcome === "updated"
          ? "updated"
          : outcome === "skipped"
            ? "skipped"
            : "errors"
      ]++;
      if (outcome === "updated") {
        result.details.push(
          `Partido eliminatoria ${knockoutDbId} actualizado vía detail (BSD ${bsdEventId}): ${event.home_score}-${event.away_score}`,
        );
      }
    }

    // Fallback para partidos de grupos con mapping BSD que no aparecieron en el feed
    // (ej. el partido terminó y BSD ya lo quitó del feed vivo antes del próximo tick)
    for (const [bsdEventId, localMatchId] of bsdToLocalGroup.entries()) {
      if (processedBsdIds.has(bsdEventId)) continue;

      const existing = await prisma.groupMatchScore.findUnique({
        where: { matchId: localMatchId },
      });
      if (existing?.homeScore != null || existing?.awayScore != null) continue;

      const event = await getEventDetail(bsdEventId);
      if (!event) {
        result.skipped++;
        continue;
      }
      if (event.status !== "finished") {
        result.skipped++;
        continue;
      }

      const outcome = await syncGroupMatch(localMatchId, event);
      result[
        outcome === "updated"
          ? "updated"
          : outcome === "skipped"
            ? "skipped"
            : "errors"
      ]++;
      if (outcome === "updated") {
        result.details.push(
          `Partido grupos #${localMatchId} actualizado vía detail (BSD ${bsdEventId}): ${event.home_score}-${event.away_score}`,
        );
      }
    }
  } catch (err) {
    console.error("[BSD Sync] Error en syncLiveMatches:", err);
    result.errors++;
    result.details.push(`Error general: ${String(err)}`);
    await logSync(
      "live_poll",
      "error",
      result,
      Date.now() - startMs,
      String(err),
    );
    return result;
  }

  await logSync("live_poll", "ok", result, Date.now() - startMs);
  return result;
}

// ── Sync de un partido específico por ID BSD ─────────────────────────────────

/**
 * Sincroniza un partido específico de grupos usando su ID BSD.
 * Usado por el admin para "Sync ahora" desde el panel.
 */
export async function syncSingleGroupMatch(
  localMatchId: number,
): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, skipped: 0, errors: 0, details: [] };

  const bsdEventId = getBsdEventIdForGroupMatch(localMatchId);
  if (!bsdEventId) {
    result.skipped = 1;
    result.details.push(`Partido #${localMatchId} no tiene mapeo BSD`);
    return result;
  }

  const event = await getEventDetail(bsdEventId);
  if (!event) {
    result.errors = 1;
    result.details.push(
      `No se pudo obtener datos BSD para evento ${bsdEventId}`,
    );
    return result;
  }

  const outcome = await syncGroupMatch(localMatchId, event);
  result[
    outcome === "updated"
      ? "updated"
      : outcome === "skipped"
        ? "skipped"
        : "errors"
  ] = 1;
  if (outcome === "updated") {
    result.details.push(
      `Partido #${localMatchId} actualizado desde BSD: ${event.home_score}-${event.away_score} (${event.status})`,
    );
  } else if (outcome === "skipped") {
    result.details.push(
      `Partido #${localMatchId} saltado (override manual o sin cambios)`,
    );
  }

  return result;
}

// ── Utilidades ───────────────────────────────────────────────────────────────

function buildBsdToLocalGroupMap(): Map<number, number> {
  // Import dinámico del mapping estático
  const { GROUP_STAGE_BSD_MAP } = require("@/lib/bsd-mapping");
  const map = new Map<number, number>();
  for (const [localId, bsdId] of Object.entries(GROUP_STAGE_BSD_MAP)) {
    map.set(bsdId as number, Number(localId));
  }
  return map;
}

async function logSync(
  syncType: string,
  status: string,
  result: SyncResult,
  durationMs: number,
  errorMessage?: string,
) {
  try {
    await prisma.bsdSyncLog.create({
      data: {
        syncType,
        status,
        matchesUpdated: result.updated,
        errorMessage: errorMessage ?? null,
        durationMs,
      },
    });
  } catch {
    // No propagar errores del log
  }
}

/**
 * Obtiene el último log de sync para mostrar en el panel admin.
 */
export async function getLastSyncStatus() {
  try {
    const lastLogs = await prisma.bsdSyncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return lastLogs;
  } catch {
    return [];
  }
}
