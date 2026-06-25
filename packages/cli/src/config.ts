/** Strip characters that would break out of the JS string literals below.
 *  Values are operator-supplied on the command line, so this is belt-and-braces. */
function sanitize(v: string): string {
  return v.replace(/["\\\r\n]/g, "");
}

/**
 * Generate the runtime `config.js` the served demo loads before its app module.
 * Mirrors the container entrypoint (deploy/docker-entrypoint.d) so `npx orbidicom`
 * and the Docker image produce an identical `window.__ORBIDICOM_CONFIG__` shape.
 */
export function configScript(opts: { pacs?: string; study?: string }): string {
  const pacsUrl = sanitize(opts.pacs ?? "");
  const studyUid = sanitize(opts.study ?? "");
  return `window.__ORBIDICOM_CONFIG__ = {\n  pacsUrl: "${pacsUrl}",\n  studyUid: "${studyUid}",\n};\n`;
}
