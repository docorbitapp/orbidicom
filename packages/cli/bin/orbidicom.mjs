#!/usr/bin/env node
import { parseArgs } from "../dist/args.js";
import { serve } from "../dist/serve.js";

const opts = parseArgs(process.argv.slice(2));

if (opts.command === "serve") {
  const { url } = await serve(opts);
  console.log(`OrbiDICOM running at ${url} (local mode — drag in .dcm files)`);
  if (opts.pacs) console.log(`PACS: ${opts.pacs}`);
} else if (opts.command === "init") {
  console.log(
    "Scaffolding is implemented in the CLI plan. For now: clone the repo and `make dev`.",
  );
} else if (opts.command === "ai") {
  console.log("The AI assistant is implemented in the CLI plan (optional, BYO key).");
} else {
  console.log(`Unknown command: ${opts.command}`);
  process.exit(1);
}
