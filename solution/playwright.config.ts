import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    video: "on",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Playwright construit et démarre lui-même l'appli (build de prod), en mode hors ligne :
  // les données viennent du snapshot, elles sont donc toujours les mêmes.
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    env: { VELIB_OFFLINE: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
