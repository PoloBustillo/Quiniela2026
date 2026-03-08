import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * Starts a local dev server automatically for the test run.
 * Set TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test for authenticated tests.
 * Set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD for admin tests.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    // Default to IPv4 loopback to avoid environments where localhost resolves to ::1.
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev -- --hostname 127.0.0.1 --port 3000",
    url: process.env.BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    // Setup project: saves auth state for regular user and admin
    { name: "setup", testMatch: "tests/e2e/auth.setup.ts" },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
