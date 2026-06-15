import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:./data/e2e.db",
      AUTH_URL: "http://127.0.0.1:3000",
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      AUTH_TRUST_HOST: "true",
      AUTH_GOOGLE_ID: "e2e-stub",
      AUTH_GOOGLE_SECRET: "e2e-stub",
      AUTH_GOOGLE_HD: "snu.ac.kr",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
