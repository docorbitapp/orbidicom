import { defineConfig } from "vitest/config";

// mergeConfig is pure (no DOM), so node is enough. Picked up by the root
// vitest.workspace.ts glob (apps/*/vitest.config.ts).
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.spec.ts"] },
});
