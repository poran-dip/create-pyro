import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // template/ has its own suites, run against a scaffolded copy in CI.
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
  },
});
