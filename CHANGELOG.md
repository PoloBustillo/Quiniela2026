# Changelog

## 2026-05-25

### Changed

- **`vercel.json`** — Se eliminó la sección `crons` para evitar fallos de deploy en Vercel Hobby (no permite cron de alta frecuencia).
- **`scripts/trigger-bsd-sync-cron.js`** — Nuevo runner de cron externo que dispara `GET /api/cron/sync-bsd` con `Authorization: Bearer CRON_SECRET`.
- **`scripts/trigger-bsd-sync-cron.sh`** — Runner bash (curl) para servidores Linux/DigitalOcean sin depender de Node en el scheduler.
- **`package.json`** — Nuevo comando `npm run cron:bsd-sync` para usar desde servidor/scheduler externo.
- **`package.json`** — Nuevo comando `npm run cron:bsd-sync:bash` para usar el runner bash en cron de Droplet.
- **`app/api/cron/sync-bsd/route.ts`** — Actualizada la documentación del endpoint para reflejar arquitectura de scheduler externo.
- **`.github/workflows/bsd-sync-cron.yml`** — Nuevo scheduler con GitHub Actions cada 10 minutos, con compuerta por fecha/hora (CDMX) para ejecutar solo en ventana útil del Mundial y evitar llamadas innecesarias.
- **`.github/workflows/bsd-sync-cron.yml`** — La compuerta ahora también valida día con partido (leyendo `data/matches.json` en zona horaria CDMX) antes de disparar el endpoint.

### Fixed

- **`lib/bsd-sync.ts`** — `syncLiveMatches` ya no abandona si no hay eventos WC en vivo; sigue revisando los partidos de eliminatoria con `bsdEventId` explícito llamando `getEventDetail()` directamente. Esto permite sincronizar eventos de ligas distintas a WC (útil para pruebas) y partidos que BSD retiró del feed en vivo pero ya tienen score.
- **`app/api/admin/matches/route.ts`** — `manualOverride` y `syncSource:"manual"` solo se activan cuando se envía `homeScore` o `awayScore`. Cambios de fecha, estadio o ciudad ya no marcan el partido como override manual.
- **`app/api/admin/group-matches/route.ts`** — Mismo fix: `manualOverride` solo al cambiar scores; cambios de fecha/hora del partido no lo activan.
- **`components/ClientHomePage.tsx`** — La vista "Por fecha" ahora ordena los bloques de fecha cronológicamente usando la fecha real del primer partido de cada bloque. Antes dependía del orden de inserción del `reduce`, que podía ser incorrecto cuando los partidos de grupos y eliminatorias estaban mezclados.

## 2026-05-24

### Added — BSD Sports API Integration (incremental, non-invasive)

- **`lib/bsd-client.ts`** — Cliente tipado de BSD API v2 con timeout 8s, fallback a null en cualquier error, sin dependencias críticas.
- **`lib/bsd-mapping.ts`** — Mapeo estático de los 72 partidos de fase de grupos (ID local → BSD event ID). Verificado contra la API real.
- **`lib/bsd-sync.ts`** — Servicio de sync con lógica de manual override, recálculo de puntos, y logging a `BsdSyncLog`.
- **`app/api/admin/bsd/route.ts`** — Endpoint admin `GET/POST /api/admin/bsd` para ver estado y disparar syncs manuales.
- **`app/api/cron/sync-bsd/route.ts`** — Endpoint de Vercel cron para polling automático cada minuto durante partidos en vivo.
- **`components/admin/BsdSyncPanel.tsx`** — Panel en nueva tab "BSD Sync" del admin para monitorear y controlar la integración.

### Changed

- **`prisma/schema.prisma`** — Campos adicionales no invasivos en `Match` y `GroupMatchScore`: `bsdEventId`, `manualOverride`, `lastSyncedAt`, `syncSource`. Nueva tabla `BsdSyncLog`.
- **`app/api/admin/group-matches/route.ts`** — PUT ahora activa `manualOverride=true` al guardar manualmente (protege de sobrescritura BSD).
- **`app/api/admin/matches/route.ts`** — PUT ahora activa `manualOverride=true` al guardar manualmente.
- **`components/admin/AllMatchesManager.tsx`** — Nueva tab "BSD Sync" con `BsdSyncPanel`.
- **`vercel.json`** — Cron job configurado: `* * * * *` → `/api/cron/sync-bsd`.

### Migration

- `prisma/migrations/20260524062841_add_bsd_sync_fields/` — Migración aplicada en producción (Neon DB).

### Notes

- La operación manual sigue funcionando exactamente como antes.
- BSD falla silenciosamente — ningún error de BSD rompe el sistema.
- `manualOverride=true` bloquea todo update automático hasta que el admin lo resetee.
- World Cup 2026 en BSD: `league_id=27`, `season_id=188`.


### Fixed

- Admin Finales phase selector in [components/admin/AllMatchesManager.tsx](components/admin/AllMatchesManager.tsx) now points back to `QUARTER_FINAL`, matching seeded DB quarter-final matches.
- Removed the unused `ROUND_OF_8` quarter-final bucket from user-facing phase maps and deleted the confirmed unused TBD/TBD DB row.
- Compare summary points in [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx) now count only started matches visible in the comparison.
- Active point rules now drive recalculation in admin match score updates and scoring scripts.
- Prediction saves now reject unpaid tournament tiers and invalid match dates server-side.
- Admin date handling no longer falls back to the current time for invalid Mexico City input.

### Added

- Deep audit report added in [AUDIT_QUINIELAS_2026.md](AUDIT_QUINIELAS_2026.md) with phase, compare, payment, scoring, and clock-risk findings.

## 2026-04-22

### Fixed

- Mobile compact prediction card layout in [components/PredictionCard.tsx](components/PredictionCard.tsx):
- Increased vertical space to avoid flag overlap.
- Reorganized content into a taller two-row structure.
- Removed `+/-` score steppers from compact flow (mobile-first), keeping direct numeric input.

- Skeleton alignment in [components/ui/skeletons.tsx](components/ui/skeletons.tsx):
- Updated compact list skeleton to match new card proportions.

- Tournament segmentation in [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx):
- Torneo 2 now includes `ROUND_OF_32` + `ROUND_OF_16`.
- Torneo 3 now includes final phases (`QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`, `FINAL`).

- Knockout mapping bugs:
- [app/api/predictions/route.ts](app/api/predictions/route.ts) now resolves knockout synthetic IDs by ordered index and rejects invalid IDs.
- [app/leaderboard/page.tsx](app/leaderboard/page.tsx) now computes finished knockout IDs with synthetic IDs and includes knockout matches in `matchMap`.

### Changed

- Quota visibility for all users in leaderboard/compare data sources:
- [app/leaderboard/page.tsx](app/leaderboard/page.tsx) now loads all users (not only paid), preserving payment flags for UI status.
- [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx) now loads all users.

- Multi-user expand in leaderboard:
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) now allows expanding several users simultaneously.

- Payment status badges:
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) now shows cuota status per user according to selected torneo.

### Security

- Prediction privacy hardening (server-side sanitization):
- [app/leaderboard/page.tsx](app/leaderboard/page.tsx) and [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx) now hide other users' scores until match start before sending data to client.
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) and [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx) now render locked state for unrevealed scores.

- Stable knockout prediction IDs:
- [app/page.tsx](app/page.tsx) now uses `match_<real_knockout_cuid>` for knockout cards instead of synthetic `match_1000+` IDs.
- [app/api/predictions/route.ts](app/api/predictions/route.ts) now accepts stable IDs, resolves knockout matches by real DB ID, and rewrites legacy synthetic IDs to stable format on save.
- [app/leaderboard/page.tsx](app/leaderboard/page.tsx) and [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx) now normalize legacy synthetic knockout prediction IDs to stable IDs.

- Phase visibility and naming consistency:
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) now labels `ROUND_OF_16` as `16vos` and keeps Torneo 2 as `32vos + 16vos`.
- [components/ClientHomePage.tsx](components/ClientHomePage.tsx) now labels `ROUND_OF_16` as `16vos` in phase view.
- [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx) now includes `THIRD_PLACE` in phase filters and labels `ROUND_OF_16` as `16vos`.

- Mixed ID sorting bug in expanded leaderboard predictions:
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) now uses match order metadata instead of `parseInt` to sort predictions, avoiding broken ordering with knockout cuid IDs.

- Terminology correction (`16vos` != `octavos`) in user-facing filters/labels:
- [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx), [components/ClientHomePage.tsx](components/ClientHomePage.tsx), and [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx) now label `ROUND_OF_16` as `16vos`.

- Admin torneo phase segmentation mismatch:
- [components/admin/AllMatchesManager.tsx](components/admin/AllMatchesManager.tsx) now includes `ROUND_OF_16` in Torneo 2 and starts Finales from `QUARTER_FINAL`.

- Knockout points recomputation bug after ID migration:
- [app/api/admin/matches/route.ts](app/api/admin/matches/route.ts) now recalculates predictions using stable `match_<cuid>` IDs with legacy fallback, instead of legacy-only synthetic index IDs.

- Scoring utility scripts alignment with stable IDs:
- [scripts/recalculate-all-points.ts](scripts/recalculate-all-points.ts) and [scripts/test-scoring-system.ts](scripts/test-scoring-system.ts) now query knockout predictions using stable IDs and legacy fallback.
