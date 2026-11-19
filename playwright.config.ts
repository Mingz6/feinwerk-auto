import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/feinwerk-auto/`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "e2e", testMatch: /(theme|lang)\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "axe", testMatch: /a11y\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/feinwerk-auto/`,
    reuseExistingServer: !process.env.CI,
  },
});
