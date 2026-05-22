# Known Bugs

## Open

1. Legacy synthetic knockout predictions still exist in DB rows (fix disponible)

- Scope: [app/api/predictions/route.ts](app/api/predictions/route.ts), [app/leaderboard/page.tsx](app/leaderboard/page.tsx), [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx)
- Detail: Historical rows saved as `match_1000+` are normalized at read time and rewritten on new saves. Se agregó migración one-shot para limpiar filas legacy existentes.
- Risk: Low-medium. Behavior is compatible today, but legacy rows remain technical debt.
- Recommendation: Ejecutar `bun run db:migrate-legacy-predictions` para reescribir todas las predicciones knockout a `match_<real_cuid>`.

## Closed in this cycle

1. Suspect `ROUND_OF_8` DB row created duplicate quarter-final bucket

- Previous behavior: DB had one TBD/TBD `ROUND_OF_8` row dated 2026-05-22 and UI maps could include `ROUND_OF_8` as another Cuartos bucket.
- Status: Fixed. Confirmed zero predictions for the row, deleted it from DB, and removed `ROUND_OF_8` from user-facing/admin phase maps.

1. Compare summary points included hidden future matches

- Previous behavior: compare rows were limited to started matches, but score summary still summed all predictions for the selected phase.
- Status: Fixed in [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx).

1. Points rule admin did not drive scoring

- Previous behavior: active point rules could be edited, but recalculation used hardcoded defaults only.
- Status: Fixed in [lib/points.ts](lib/points.ts), [app/api/admin/matches/route.ts](app/api/admin/matches/route.ts), [app/api/admin/group-matches/route.ts](app/api/admin/group-matches/route.ts), and scoring scripts.

1. Predictions could be saved without paying the corresponding quiniela

- Previous behavior: [app/api/predictions/route.ts](app/api/predictions/route.ts) validated auth and kickoff time, but not `paidGroupStage`, `paidKnockout`, or `paidFinals`.
- Status: Fixed. Prediction saves now require the matching paid tier or legacy `hasPaid`.

1. Invalid admin Mexico-time input could fall back to current time

- Previous behavior: `fromMexicoCityTime` returned `new Date()` for invalid input, which could create a match at the current time.
- Status: Fixed in [lib/points.ts](lib/points.ts), [app/api/admin/matches/route.ts](app/api/admin/matches/route.ts), and [app/api/admin/group-matches/route.ts](app/api/admin/group-matches/route.ts).

1. Knockout validation selected wrong DB match

- Previous behavior: knockout prediction validation used an effectively empty `findFirst` filter and could evaluate the wrong match time/phase.
- Status: Fixed in [app/api/predictions/route.ts](app/api/predictions/route.ts).

1. Finished-state tracking for knockout predictions in leaderboard

- Previous behavior: leaderboard finished set used DB cuid IDs while predictions used synthetic `match_1000+` IDs, causing false pending states.
- Status: Fixed in [app/leaderboard/page.tsx](app/leaderboard/page.tsx).

1. Other users' scores could be visible before kickoff in client views

- Previous behavior: score visibility relied on client rendering assumptions.
- Status: Fixed with server-side sanitization in [app/leaderboard/page.tsx](app/leaderboard/page.tsx) and [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx), with lock-state UI in [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx) and [app/leaderboard/compare/CompareClient.tsx](app/leaderboard/compare/CompareClient.tsx).

1. Synthetic knockout IDs were order-sensitive

- Previous behavior: knockout predictions relied on generated IDs (`match_1000 + index`) tied to ordered knockout matches.
- Status: Fixed for new writes and runtime normalization in [app/page.tsx](app/page.tsx), [app/api/predictions/route.ts](app/api/predictions/route.ts), [app/leaderboard/page.tsx](app/leaderboard/page.tsx), and [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx).

1. Admin match result updates recalculated points with outdated knockout ID mapping

- Previous behavior: [app/api/admin/matches/route.ts](app/api/admin/matches/route.ts) used legacy synthetic index IDs only, missing stable-ID predictions.
- Status: Fixed in [app/api/admin/matches/route.ts](app/api/admin/matches/route.ts).

1. Admin torneo segmentation placed `ROUND_OF_16` under Finales

- Previous behavior: [components/admin/AllMatchesManager.tsx](components/admin/AllMatchesManager.tsx) set Finales from `ROUND_OF_16`, conflicting with Torneo 2 rules.
- Status: Fixed in [components/admin/AllMatchesManager.tsx](components/admin/AllMatchesManager.tsx).

1. Scoring scripts queried knockout predictions with old non-prefixed IDs

- Previous behavior: [scripts/recalculate-all-points.ts](scripts/recalculate-all-points.ts) and [scripts/test-scoring-system.ts](scripts/test-scoring-system.ts) missed stable knockout predictions.
- Status: Fixed in both scripts.
