# orbidicom

## 0.3.0

### Minor Changes

- PACS authentication is now configurable per deployment. `npx orbidicom` gains
  `--auth <none|basic|bearer|cookie>` with `--token` (bearer) and `--username`/
  `--password` (basic); the Docker image reads `ORBIDICOM_AUTH_KIND` / `_TOKEN` /
  `_USERNAME` / `_PASSWORD`; the Helm chart adds a `pacs.auth` block. The viewer
  applies the chosen strategy (already supported by `@orbidicom/core`'s `AuthStrategy`)
  to its DICOMweb requests; auth is read from the base config only, never URL query
  params. SECURITY: basic/bearer credentials are embedded in the client-readable
  config.js — prefer `cookie`/same-origin, or inject credentials from a Kubernetes
  Secret via `extraEnv` and keep them out of plain values.
