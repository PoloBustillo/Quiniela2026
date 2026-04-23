# Known Bugs

## Open

1. Legacy synthetic knockout predictions still exist in DB rows

- Scope: [app/api/predictions/route.ts](app/api/predictions/route.ts), [app/leaderboard/page.tsx](app/leaderboard/page.tsx), [app/leaderboard/compare/page.tsx](app/leaderboard/compare/page.tsx)
- Detail: Historical rows saved as `match_1000+` are normalized at read time and rewritten on new saves, but a full one-time migration has not yet been executed.
- Risk: Low-medium. Behavior is compatible today, but legacy rows remain technical debt.
- Recommendation: Run a one-time DB migration to rewrite all knockout predictions to `match_<real_cuid>`.

1. Phase model gap: no dedicated enum value for octavos

- Scope: [prisma/schema.prisma](prisma/schema.prisma), [components/LeaderboardByPhase.tsx](components/LeaderboardByPhase.tsx), [components/admin/AllMatchesManager.tsx](components/admin/AllMatchesManager.tsx)
- Detail: Product now treats `16vos` and `octavos` as distinct, but Prisma enum currently only has `ROUND_OF_16` and no dedicated octavos phase.
- Risk: Medium. If both rounds are required simultaneously, one round cannot be represented distinctly in DB.
- Recommendation: add a dedicated enum phase (e.g. `ROUND_OF_8`) with migration and update admin/UI filters.

## Closed in this cycle

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
