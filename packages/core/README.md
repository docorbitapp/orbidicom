# @orbidicom/core

Framework-agnostic engine for [OrbiDICOM](https://github.com/docorbitapp/orbidicom) — a modern,
mobile-responsive DICOM viewer. Owns Cornerstone3D setup, the pluggable `DataSource` interface
(PACS / DICOMweb / local files), auth strategies, and the tool/window-level preset registry.

No Vue, no DOM-framework code, no hardcoded endpoints.

## Install

```sh
npm install @orbidicom/core
```

## Usage

```ts
import { /* DataSource, registry, presets, ... */ } from "@orbidicom/core";
```

A backend is added by implementing the `DataSource` contract (`getSeries`, `getImageIds`,
optional `getMetadata`/`downloadArchive`, plus `capabilities`) — the UI never branches on
backend type.

## License

MIT
