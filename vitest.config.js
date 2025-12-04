import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      clean: true,
      cleanOnRerun: true,
      exclude: ["node_modules/", "tests/e2e/", "tests/E2E/"],
      // Note: tempDirectory may not be fully supported by v8 provider
      // Ensure .coverage-tmp directory exists before running tests
    },
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
    testTimeout: 10000,
  },
});
