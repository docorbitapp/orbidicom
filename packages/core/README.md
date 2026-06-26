# @orbidicom/core

Framework-agnostic engine for [OrbiDICOM](https://github.com/docorbitapp/orbidicom) — a modern,
mobile-responsive DICOM viewer. Owns Cornerstone3D setup, the pluggable `DataSource` interface
(PACS / DICOMweb / local files), auth strategies, and the tool/window-level preset registry.

No Vue, no DOM-framework code, no hardcoded endpoints.

## What's inside

- **Data sources** — `DicomWebDataSource` (QIDO/WADO-RS), `LocalDataSource` (`.dcm` files),
  `NiftiDataSource`, all implementing the pluggable [`DataSource`](src/datasource.ts) interface.
- **Auth strategies** — `none` / `basic` / `bearer` / `cookie` / custom.
- **Registries** — `registerTool` / `registerWindowPreset` and a modality-aware
  `windowPresetsFor` preset engine.
- **Keyboard shortcuts** — a framework-agnostic keymap (`DEFAULT_KEYMAP`, `resolveHotkey`).
- **Cornerstone3D setup** — `initCornerstone`, `createStack`, plus DICOM metadata + SR parsing.

## Install

```sh
npm install @orbidicom/core
```

## Usage

Use a built-in data source:

```ts
import { DicomWebDataSource } from "@orbidicom/core";

const source = new DicomWebDataSource({ root: "/dicom-web" });
const series = await source.getSeries(["1.2.840…"]);
const imageIds = await source.getImageIds(series[0]);
```

…or add your own backend by implementing the `DataSource` contract — `getSeries`,
`getImageIds`, optional `getMetadata` / `downloadArchive`, plus `capabilities`. The UI never
branches on backend type, so a new backend is a new adapter, not a UI change:

```ts
import type { DataSource, SeriesSummary } from "@orbidicom/core";

class MyPacs implements DataSource {
  capabilities = { multiStudy: true };
  async getSeries(studyUids: string[]): Promise<SeriesSummary[]> {
    /* … */ return [];
  }
  async getImageIds(series: SeriesSummary): Promise<string[]> {
    /* … */ return [];
  }
}
```

Register window presets for any modality (CT ships five standard windows):

```ts
import { registerWindowPreset, windowPresetsFor } from "@orbidicom/core";

registerWindowPreset({ modality: "MR", name: "Brain T2", windowWidth: 2200, windowCenter: 1100 });
windowPresetsFor("MR"); // → [{ modality: "MR", name: "Brain T2", … }]
```

## Plugins & data sources

Bundle tools, window presets, and backend factories into a plugin and register them in one
call — they fan out to the registries the UI reads from:

```ts
import { registerPlugin, createDataSource } from "@orbidicom/core";

registerPlugin({
  name: "acme-extras",
  windowPresets: [{ modality: "CT", name: "Stroke", windowWidth: 40, windowCenter: 40 }],
  // tools: [...], dataSources: [{ id: "acme", label: "Acme PACS", create: (cfg) => new AcmeSource(cfg) }],
});

// The built-in adapters are pre-registered, so you can build one by id:
const source = createDataSource("dicomweb", { root: "/dicom-web" });
```

## Roadmap

See the project [ROADMAP.md](https://github.com/docorbitapp/orbidicom/blob/main/ROADMAP.md).
Shipped here: a volume engine for MPR + 3D volume rendering (`createMprView`, VR presets) and
measurement export (`collectMeasurements`, JSON/CSV). Next up: DICOM-SEG, DICOM-SR generation,
and a public plugin SDK around these registries.

## License

MIT
