# Changelog

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
