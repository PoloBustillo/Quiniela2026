/**
 * Authentication setup for Playwright E2E tests.
 *
 * Saves browser storage state (cookies/session) for a regular user
 * and an admin user so that subsequent test projects can restore
 * sessions without logging in on every test.
 *
 * Prerequisites:
 *   - Dev server running at BASE_URL (default http://localhost:3000)
 *   - .env.test (or env vars) with:
 *       TEST_USER_EMAIL, TEST_USER_PASSWORD  — a valid non-admin account
 *       TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD — a valid admin account
 *   - NextAuth credentials provider enabled  (app/api/auth/[...nextauth]/route.ts)
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const USER_FILE = path.join(__dirname, ".auth/user.json");
const ADMIN_FILE = path.join(__dirname, ".auth/admin.json");

setup("authenticate as regular user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠  TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping user auth setup.",
    );
    // Write an empty storage state so downstream tests can still run (they'll just be unauthenticated)
    await page.context().storageState({ path: USER_FILE });
    return;
  }

  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /iniciar|sign in|entrar/i }).click();

  // Wait for successful redirect away from sign-in page
  await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10_000 });

  await page.context().storageState({ path: USER_FILE });
});

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠  TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set — skipping admin auth setup.",
    );
    await page.context().storageState({ path: ADMIN_FILE });
    return;
  }

  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /iniciar|sign in|entrar/i }).click();

  await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10_000 });

  await page.context().storageState({ path: ADMIN_FILE });
});
