import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // les tests E2E (Playwright) ne sont pas des tests Vitest
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
