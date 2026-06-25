// Copy the prebuilt demo (apps/demo/dist) into this package's public/ so the
// published `orbidicom` CLI ships the viewer itself and has no runtime workspace
// dependency. Run after the demo is built (see the root `build` script order).
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const demoDist = resolve(here, "../../../apps/demo/dist");
const dest = resolve(here, "../public");

if (!existsSync(resolve(demoDist, "index.html"))) {
  console.error(
    `[bundle-demo] demo build not found at ${demoDist}\n` +
      "Build the demo first:  pnpm --filter @orbidicom/demo build",
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(demoDist, dest, { recursive: true });
console.log(`[bundle-demo] copied demo build -> ${dest}`);
