import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests for Folio, run against a REAL app + Medplum server.
 *
 *   BASE_URL   the app under test (default http://localhost:3000)
 *   .env.local supplies the Medplum service credentials the fixtures use to
 *              provision disposable accounts and clean up afterwards
 *
 * Every spec provisions its own users and patients in a dedicated
 * "E2E Test Facility" organization, drives the real UI through the real
 * API routes, and removes what it created. Specs are independent of each
 * other; steps within a spec run in order.
 *
 *   npm run e2e            headless
 *   npm run e2e:headed     watch it happen
 *   npm run e2e:report     open the last HTML report
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  outputDir: "e2e/artifacts",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
