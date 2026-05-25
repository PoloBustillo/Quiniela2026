# AI Context

## Date

- 2026-05-24

## BSD Sports API Integration

- **Integración incremental y no invasiva** con BSD Sports API (https://sports.bzzoiro.com/)
- **BSD_API_TOKEN** debe configurarse en `.env` y en Vercel Environment Variables
- `league_id: 27`, `season_id: 188` = FIFA World Cup 2026 en BSD
- Todos los 72 partidos de fase de grupos tienen mapeo estático en `lib/bsd-mapping.ts`
- Los partidos de eliminatoria se mapean asignando `bsdEventId` al crearlos en el panel admin
- **manualOverride = true** bloquea cualquier actualización automática de ese partido
- Cuando el admin guarda un score manualmente, `manualOverride` se activa automáticamente
- BSD se trata como "best effort" — si falla, el sistema sigue funcionando

## Archivos de integración BSD

- `lib/bsd-client.ts` — wrapper de la API con timeout y fallback
- `lib/bsd-sync.ts` — lógica de sync, respeta manualOverride, recalcula puntos
- `lib/bsd-mapping.ts` — mapeo estático local_id → bsd_event_id
- `app/api/admin/bsd/route.ts` — endpoint admin para control manual del sync
- `app/api/cron/sync-bsd/route.ts` — endpoint para Vercel cron (cada minuto)
- `components/admin/BsdSyncPanel.tsx` — UI panel en tab "BSD Sync" del admin

## Vercel Cron

- Refactor 2026-05-24: removido de `vercel.json` por limitación de Vercel Hobby
	(jobs frecuentes fallan en deploy).
- El endpoint `/api/cron/sync-bsd` se mantiene y debe ser llamado por scheduler externo.
- Script helper disponible: `npm run cron:bsd-sync` (usa `APP_URL` + `CRON_SECRET`).
- Script bash para servidores (DigitalOcean Droplet):
	`scripts/trigger-bsd-sync-cron.sh` y comando `npm run cron:bsd-sync:bash`.
- Seguridad: siempre requiere `Authorization: Bearer CRON_SECRET`.
- Opción implementada: GitHub Actions `/.github/workflows/bsd-sync-cron.yml`
	con ejecución cada 10 minutos y compuerta por ventana de Mundial/horario CDMX.
	Además valida que el día actual tenga partidos en `data/matches.json`
	(timezone `America/Mexico_City`) antes de disparar el sync.
	Usa secrets de repositorio: `APP_URL` y `CRON_SECRET`.

## Variables de entorno requeridas

- `BSD_API_TOKEN=667ccb4b29ade16c6863e4ebdfa03268f3882dff`
- `CRON_SECRET=<valor_aleatorio>` (protege el endpoint del cron)

## Current Product Rules

- There are 3 quinielas with independent winners:
- 1. Group stage
- 1. Round of 32 + Round of 16 (16vos)
- 1. Final phases (Quarterfinals, Semifinals, Third Place, Final)
- Current canonical quarter-final phase is `QUARTER_FINAL`; `ROUND_OF_8` exists in schema history only and should stay out of user-facing filters unless product explicitly redefines it.

## Phase Terminology

- In this product context, `16vos` and `octavos` must be treated as different phases.
- `ROUND_OF_16` is used for 8vos/octavos in current seeded knockout data.
- Avoid adding `ROUND_OF_8` to user-facing phase filters unless the data model is intentionally migrated.

## UI Direction

- Mobile compact prediction cards must prioritize legibility of team flags and names.
- Mobile score input should avoid overcrowded controls; direct numeric input is preferred.
- Leaderboard rows can be expanded for multiple users at the same time.

## Privacy Rules

- A user can only see another user's predicted score after the match start time.
- Before match start, other users' scores must be sanitized server-side (not only hidden in UI).

## Quota Visibility

- All users should be listed in leaderboard/compare views so cuota coverage can be visible to everyone.
- Each row should show quota status for the current torneo tab.
- Saving a prediction now requires the matching paid tier (`paidGroupStage`, `paidKnockout`, or `paidFinals`) unless legacy `hasPaid` is true.

## Scoring Rules

- `calculatePoints` accepts active rule values and defaults to 5 exact / 3 winner / 3 draw / 2 goal difference.
- Admin score updates fetch the active `PointsRule` before recalculating predictions.

## Knockout ID Mapping

- Knockout predictions are persisted with stable IDs (`match_<Match.id>` using DB cuid).
- Legacy synthetic IDs (`match_1000+`) are normalized on read and rewritten to stable IDs on save.
