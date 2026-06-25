// Each package owns its own vitest.config.ts (so core runs in node and vue in jsdom).
// Only directories that actually have a config + tests are picked up.
export default ["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"];
