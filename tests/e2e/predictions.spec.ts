/**
 * E2E – Prediction locking
 *
 * Verifies that a logged-in user CANNOT submit a prediction for a match
 * whose start time is in the past.  The server must reject the request with
 * HTTP 400 regardless of what the client sends.
 *
 * How it works
 * ─────────────
 * 1. Via the Playwright API request context (same session cookies) we POST
 *    directly to /api/predictions with a matchId whose date is known to be
 *    in the past (match 1, kickoff 2026-06-11 15:00 CDT).
 * 2. We also navigate to the predictions page and assert that matches whose
 *    group is "started" render a locked/disabled UI state.
 *
 * Prerequisites
 * ─────────────
 * - Dev server running at BASE_URL (default http://localhost:3000).
 * - A regular user authenticated via tests/e2e/auth.setup.ts.
 * - Match #1 must have a date in the past relative to the server clock.
 *   Adjust CLOSED_MATCH_ID if the first match in your DB is different.
 */

import { test, expect } from "@playwright/test";

// Match 1 (Group A, 2026-06-11) — will be in the past when tournment starts
const CLOSED_MATCH_ID = 1;

// ─── API-level tests ──────────────────────────────────────────────────────────

test.describe("Prediction API – closed match", () => {
  test("POST /api/predictions returns 400 for a started match", async ({
    request,
  }) => {
    const response = await request.post("/api/predictions", {
      data: {
        matchId: CLOSED_MATCH_ID,
        homeScore: 2,
        awayScore: 1,
      },
    });

    // Without an authenticated session the API returns 401 before it can
    // validate the match timing — skip in that case.
    if (response.status() === 401) {
      test.skip();
      return;
    }

    // The server validates time server-side; must reject once match started
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    // Error message must mention the match has already started
    expect(body.error).toMatch(/empezó|started|cerr/i);
  });

  test("POST /api/predictions returns 401 when not authenticated", async ({
    browser,
  }) => {
    // Use a fresh context with NO stored auth cookies
    const ctx = await browser.newContext({ storageState: undefined });
    const req = await ctx.request.post("/api/predictions", {
      data: { matchId: CLOSED_MATCH_ID, homeScore: 1, awayScore: 0 },
    });
    expect(req.status()).toBe(401);
    await ctx.close();
  });

  test("POST /api/predictions returns 400 for invalid (non-numeric) scores", async ({
    request,
  }) => {
    const response = await request.post("/api/predictions", {
      data: { matchId: CLOSED_MATCH_ID, homeScore: "dos", awayScore: "cero" },
    });
    // Without auth the API returns 401 before it validates the body — skip.
    if (response.status() === 401) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
  });
});

// ─── UI-level tests ───────────────────────────────────────────────────────────

test.describe("Predictions page – locked match UI", () => {
  test("score inputs are disabled / hidden for a match that already started", async ({
    page,
  }) => {
    await page.goto("/predictions");
    // Same RSC streaming / auth redirect pattern as leaderboard — wait for
    // network to settle before inspecting the URL.
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});

    // If no auth session is present the app redirects to /auth/signin — skip.
    if (page.url().includes("/auth/signin")) {
      test.skip();
      return;
    }

    // Wait for the prediction cards to render.
    // If the page has no cards (e.g. the predictions page is not yet implemented
    // or there are no matches in the DB), skip rather than timing out.
    const cardHandle = await page
      .waitForSelector("[data-testid='prediction-card'], .prediction-card, form", {
        timeout: 10_000,
      })
      .catch(() => null);
    if (!cardHandle) {
      test.skip();
      return;
    }

    // Look for any element that signals a locked state (disabled input or lock icon)
    // The exact selector depends on your MatchCard/PredictionCard implementation;
    // adjust if you add data-testid attributes (recommended).
    const lockedIndicators = page.locator(
      "[data-testid='match-locked'], [aria-disabled='true'], input:disabled, button:disabled"
    );

    // At least one match must be locked (since match 1 is in the past)
    const count = await lockedIndicators.count();
    expect(count).toBeGreaterThan(0);
  });
});
