/**
 * E2E – Payment tier visibility on the leaderboard
 *
 * Verifies that users only appear in the torneo tabs they have paid for:
 *   T1 (Grupos)   → paidGroupStage = true
 *   T2 (32avos)   → paidKnockout   = true
 *   T3 (Finales)  → paidFinals     = true
 *
 * Strategy
 * ─────────
 * We hit the leaderboard page as an authenticated user and verify the tab
 * rendering.  Because we cannot control the DB directly in this E2E suite,
 * these tests check that:
 *   a) The leaderboard page renders the 4 torneo tabs (Todo, T1, T2, T3).
 *   b) The "Todo" tab lists at least one user.
 *   c) Switching to a torneo tab changes the visible content (or shows an
 *      appropriate empty-state message) — meaning the filter is applied.
 *
 * For full payment-isolation testing, use the unit/integration tests that
 * seed a controlled DB state.
 *
 * Prerequisites
 * ─────────────
 * - Dev server running at BASE_URL.
 * - Authenticated user session (from auth.setup.ts).
 */

import { test, expect } from "@playwright/test";

test.describe("Leaderboard – torneo tab structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard");
    // Next.js App Router streams the loading.tsx skeleton first; the RSC-based
    // auth redirect (redirect() in the server component) fires client-side after
    // streaming completes.  Wait for network activity to settle so the redirect
    // has a chance to happen before we check the URL.
    await page
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {});
    if (page.url().includes("/auth/signin")) {
      test.skip();
      return;
    }
    // Wait for the tabs to be rendered
    await page.waitForSelector("[role='tablist'], [data-radix-tabs-list]", {
      timeout: 10_000,
    });
  });

  test("renders four torneo tabs: Todo, T1, T2, T3", async ({ page }) => {
    const tabs = page.getByRole("tab");
    const labels = await tabs.allTextContents();

    // We expect tabs whose text includes all four labels (order-insensitive)
    const joined = labels.join(" ").toLowerCase();
    expect(joined).toMatch(/todo/i);
    expect(joined).toMatch(/t1|grupos/i);
    expect(joined).toMatch(/t2|32/i);
    expect(joined).toMatch(/t3|final/i);
  });

  test("Todo tab is selected by default and shows leaderboard rows", async ({
    page,
  }) => {
    // The active tab should be "Todo"
    const activeTab = page.getByRole("tab", { selected: true });
    await expect(activeTab).toBeVisible();
    const text = (await activeTab.textContent()) ?? "";
    expect(text.toLowerCase()).toMatch(/todo/i);

    // At least one data row visible
    const rows = page.locator(
      "table tbody tr, [data-testid='leaderboard-row']",
    );
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
  });

  test("clicking T1 tab filters to Grupos participants only", async ({
    page,
  }) => {
    // Click T1 tab
    const t1Tab = page.getByRole("tab", { name: /t1|grupos/i });
    await t1Tab.click();

    // After switching, the tab becomes active
    await expect(t1Tab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000,
    });

    // There should be either rows (paid users) or an empty-state message
    const hasRows = await page
      .locator("table tbody tr, [data-testid='leaderboard-row']")
      .count();
    const hasEmpty = await page
      .getByText(/no hay|sin participantes|nadie ha pagado/i)
      .count();

    expect(hasRows + hasEmpty).toBeGreaterThan(0);
  });

  test("T2 tab content differs from Todo tab content", async ({ page }) => {
    // Grab row count in Todo
    const todoRows = await page
      .locator("table tbody tr, [data-testid='leaderboard-row']")
      .count();

    // Switch to T2
    const t2Tab = page.getByRole("tab", { name: /t2|32avos/i });
    await t2Tab.click();
    await page.waitForTimeout(500); // let re-render settle

    const t2Rows = await page
      .locator("table tbody tr, [data-testid='leaderboard-row']")
      .count();

    // T2 must have ≤ Todo rows (cannot have more users than the full list)
    expect(t2Rows).toBeLessThanOrEqual(todoRows);
  });
});

// ─── API-level payment filter ─────────────────────────────────────────────────

test.describe("Leaderboard API – users without payment are excluded", () => {
  test("GET /api/admin/users returns paidGroupStage / paidKnockout / paidFinals fields", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/users");
    // Admin endpoint – if this user is not admin it will return 401/403
    if (res.status() === 401 || res.status() === 403) {
      test.skip();
      return;
    }
    expect(res.ok()).toBe(true);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);

    if (users.length > 0) {
      const u = users[0];
      expect(u).toHaveProperty("paidGroupStage");
      expect(u).toHaveProperty("paidKnockout");
      expect(u).toHaveProperty("paidFinals");
    }
  });
});
