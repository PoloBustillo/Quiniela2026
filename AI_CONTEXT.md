# AI Context

## Date

- 2026-04-22

## Current Product Rules

- There are 3 quinielas with independent winners:
- 1. Group stage
- 1. Round of 32 + Round of 16 (16vos)
- 1. Final phases (Quarterfinals, Semifinals, Third Place, Final)

## Phase Terminology

- In this product context, `16vos` and `octavos` must be treated as different phases.
- Current enum only models `ROUND_OF_16`; a dedicated phase value for octavos is still pending if the tournament structure requires both.

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

## Knockout ID Mapping

- Knockout predictions are persisted with stable IDs (`match_<Match.id>` using DB cuid).
- Legacy synthetic IDs (`match_1000+`) are normalized on read and rewritten to stable IDs on save.
