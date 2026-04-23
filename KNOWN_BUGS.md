# Known Bugs

## Open

1. Synthetic knockout IDs are order-sensitive
- Scope: [app/page.tsx](app/page.tsx), [app/api/predictions/route.ts](app/api/predictions/route.ts), [app/leaderboard/page.tsx](app/leaderboard/page.tsx)
- Detail: Predictions for knockout rounds rely on generated IDs (`match_1000 + index`) based on sorted knockout matches.
- Risk: If knockout match ordering changes after users have saved predictions, historical predictions can point to different matches.
- Recommendation: Persist predictions with real DB `Match.id` (cuid) and migrate old synthetic IDs.

## Closed in this cycle

1. Knockout validation selected wrong DB match
- Previous behavior: knockout prediction validation used an effectively empty `findFirst` filter and could evaluate the wrong match time/phase.
- Status: Fixed in [app/api/predictions/route.ts](app/api/predictions/route.ts).

2. Finished-state tracking for knockout predictions in leaderboard
- Previous behavior: leaderboard finished set used DB cuid IDs while predictions used synthetic `match_1000+` IDs, causing false pending states.
- Status: Fixed in [app/leaderboard/page.tsx](app/leaderboard/page.tsx).
