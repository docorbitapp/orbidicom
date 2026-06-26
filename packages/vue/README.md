# @orbidicom/vue

Vue 3 UI for [OrbiDICOM](https://github.com/docorbitapp/orbidicom) — a modern, mobile-responsive,
multilingual DICOM viewer. Components: `Viewer`, `Toolbar`, `SeriesRail`, `MetaPanel`,
`LangSwitcher`, `StudyList`, `Controls`, plus live i18n (20 built-in languages incl. RTL, searchable switcher) and
CSS-variable theming.

> This package ships Vue single-file components as **source**. You need a Vue 3 + bundler
> (Vite, etc.) toolchain that can compile `.vue`/`.ts` from `node_modules`.

## Features & roadmap

✅ shipped · ⬜ planned. Tiers and detail in [ROADMAP.md](https://github.com/docorbitapp/orbidicom/blob/main/ROADMAP.md).

| Status | Capability                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | **2D viewing** — window/level, zoom, pan, slice scroll, rotate, flip, invert                                                                                |
| ✅     | **Cine** playback — per cell, adjustable fps                                                                                                                |
| ✅     | **Measurement tools** — length, angle, rectangle & ellipse ROI, probe                                                                                       |
| ✅     | **Keyboard shortcuts** — tools, transforms, slice nav, presets (remappable)                                                                                 |
| ✅     | **W/L preset engine** — CT built-ins + modality-aware, host-extensible                                                                                      |
| ✅     | **Grid layouts** — 1–10-up, each cell independent                                                                                                           |
| ✅     | **Download slice as JPEG** — image + measurements (no patient text)                                                                                         |
| ✅     | **Reports** — encapsulated PDF + DICOM Structured Report (SR)                                                                                               |
| ✅     | **Metadata** — on-image overlay with privacy blur + full DICOM tag reader                                                                                   |
| ✅     | **Renders from any [`DataSource`](https://github.com/docorbitapp/orbidicom/blob/main/packages/core/src/datasource.ts)** — UI never branches on backend type |
| ✅     | **20 UI languages** (`setLang`, searchable `LangSwitcher`, RTL-aware) + CSS-variable theming                                                                |
| ✅     | **MPR + 3D volume rendering (VR)** — tri-planar + crosshairs + VR presets (CT-Bone, MIP, …)                                                                 |
| ✅     | **Measurement export** — JSON + CSV                                                                                                                         |
| ✅     | **STOW-RS upload** — `storeInstances` (multipart/related)                                                                                                   |
| 🟡     | **DICOM-SR export** — measurement SR generation (`buildMeasurementSr`); Part-10/STOW upload is the follow-up — _Tier 2_                                     |
| 🟡     | **DICOM-SEG** — read-only segment/labelmap parsing; WebGL render needs QA — _Tier 2_                                                                        |
| ✅     | **Hanging protocols** — `single` / `grid` built-ins + custom; `hanging-protocol` prop                                                                       |
| 🟡     | **More data sources** — STOW-RS + DICOM-JSON shipped; DIMSE/cloud need a bridge — _Tier 2_                                                                  |
| ✅     | **Study list / worklist** — QIDO-RS `searchStudies` + a `<StudyList>` filter/results component                                                              |
| ✅     | **Plugin SDK** — `registerPlugin` (tools / presets / data sources) + data-source factory registry                                                           |
| ⬜     | **AI assist** — `orbidicom ai` — _Tier 3_                                                                                                                   |

## Install

```sh
npm install @orbidicom/vue @orbidicom/core vue
```

## Usage

Pick a data source from `@orbidicom/core`, pass it to `<Viewer>`. The available sources:

- `DicomWebDataSource` — a DICOMweb PACS (QIDO + WADO-RS).
- `LocalDataSource` — local files (`.dcm`, drag & drop, study folder / zip).
- `NiftiDataSource` — a single `.nii` / `.nii.gz` volume.

```vue
<script setup lang="ts">
import { Viewer } from "@orbidicom/vue";
import "@orbidicom/vue/theme.css";
import { DicomWebDataSource } from "@orbidicom/core";

// Point at a DICOMweb PACS (optionally with an auth strategy):
const source = new DicomWebDataSource({ root: "/dicom-web" });
// const source = new DicomWebDataSource({ root: "/dicom-web", auth: { type: "bearer", token } });

// …or run fully offline on local files:
// import { LocalDataSource } from "@orbidicom/core";
// const source = new LocalDataSource();
</script>

<template>
  <Viewer :source="source" :study-uids="['1.2.840…']" />
</template>
```

Switch language at runtime (or drop in the `<LangSwitcher>` component):

```ts
import { setLang } from "@orbidicom/vue";
setLang("ja"); // en·tr·de·es·fr·it·pt·ru·zh·ja·ko·hi·id·nl·pl·ar·fa·bn·vi·uk (ar/fa are RTL)
```

Open multiple series at once with a hanging protocol (`single` — default — or `grid`, or a
custom function):

```vue
<Viewer :source="source" hanging-protocol="grid" />
```

Implement your own backend by satisfying the `DataSource` contract in `@orbidicom/core`
(`getSeries`, `getImageIds`, plus `capabilities`) — no UI changes needed.

## Supported languages

English, Türkçe, Deutsch, Español, Français, Italiano, Português, Русский, 中文, 日本語,
한국어, हिन्दी, Bahasa Indonesia, Nederlands, Polski, العربية, فارسی, বাংলা, Tiếng Việt,
Українська — with a built-in **searchable** live switcher; the right-to-left languages
(Arabic, Persian) mirror the layout via a `dir` attribute. Adding one is a small string table; see the
[add-a-locale guide](https://github.com/docorbitapp/orbidicom/tree/main/.claude/skills/add-a-locale).
Missing keys fall back to English.

## License

MIT
