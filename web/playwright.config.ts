import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * Smoke tests against the static export. Build first with the matching site URL:
 *   SITE_URL=http://localhost:4173 pnpm build && pnpm e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: `node scripts/serve.mjs out ${PORT}`, url: `http://localhost:${PORT}/`, reuseExistingServer: !process.env.CI },
});
