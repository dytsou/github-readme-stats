import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.bench.{ts,tsx,js}"],
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
});
