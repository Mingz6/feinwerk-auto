import { defineConfig, devices } from "@playwright/test";

// PW_PORT picks another port when 4321 is taken (another checkout's preview would otherwise be reused).
const PORT = Number(process.env.PW_PORT ?? 4321);
// PW_BASE_URL points at a server that is already running, the live site included (then no preview starts).
const BASE_URL = process.env.PW_BASE_URL ?? `http://localhost:${PORT}/feinwerk-auto/`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // Baselines are per platform; only linux ones are committed, since CI renders on ubuntu.
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{arg}{ext}",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "e2e", testMatch: /(theme|lang|home|services|booking|pages|french|chinese|print|nojs)\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "axe", testMatch: /a11y\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: `npx astro preview --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
      },
});
