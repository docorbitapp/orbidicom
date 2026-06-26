---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Tier 2: a Plugin SDK and lightweight hanging protocols.

- **Plugin SDK (`@orbidicom/core`)** — `registerPlugin({ name, tools, windowPresets, dataSources })`
  fans a plugin's contributions out to the core registries the UI already reads from;
  `listPlugins()` enumerates what's registered (idempotent by name). Adds a **data-source factory
  registry**: `registerDataSource`, `listDataSources`, and `createDataSource(id, config)` to build
  a backend by id — with the built-in adapters (`dicomweb`, `local`, `nifti`) pre-registered.
- **Hanging protocols (`@orbidicom/core` + `@orbidicom/vue`)** — `applyHangingProtocol(series,
protocol, { maxCells })` maps a study's series onto the grid; built-ins `single` (default) and
  `grid` (tile image series, reports excluded, into the smallest fitting layout), plus custom
  functions. `<Viewer>` gains a `hanging-protocol` prop applied once the study loads; the default
  preserves the existing single-cell behavior.
