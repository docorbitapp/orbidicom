import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { createServer } from "node:http";
import sirv from "sirv";
import type { CliOptions } from "./args";

const require = createRequire(import.meta.url);

/** Resolve the prebuilt demo's dist directory from the installed @orbidicom/demo package. */
export function demoDistDir(): string {
  const pkg = require.resolve("@orbidicom/demo/package.json");
  return resolve(dirname(pkg), "dist");
}

export async function serve(opts: CliOptions): Promise<{ port: number; url: string }> {
  const handler = sirv(demoDistDir(), { single: true, dev: false });
  const server = createServer((req, res) =>
    handler(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    }),
  );
  await new Promise<void>((r) => server.listen(opts.port, r));
  const url = `http://localhost:${opts.port}/`;
  // PACS wiring (?pacs=…) and browser auto-open are completed in the CLI plan.
  return { port: opts.port, url };
}
