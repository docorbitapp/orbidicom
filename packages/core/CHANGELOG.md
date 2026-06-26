# @orbidicom/core

## 0.4.0

### Minor Changes

- [#1](https://github.com/docorbitapp/orbidicom/pull/1) [`c3b0f9f`](https://github.com/docorbitapp/orbidicom/commit/c3b0f9f84faad92f6b5f645299c73bbffaacd04f) Thanks [@gasci](https://github.com/gasci)! - Measurement export and an MPR / volume viewport — the rest of Tier 1.

  - **Measurement export** — `@orbidicom/core` gains `collectMeasurements` /
    `measurementsToJson` / `measurementsToCsv` (Length, Angle, ROIs, Probe → normalized
    stats with units and world points). The toolbar exposes JSON and CSV export buttons
    (shown only when measurements exist); files download as `<series>_measurements_<ts>.<ext>`.
    DICOM-SR generation is intentionally deferred (needs a Part-10 writer + STOW-RS upload);
    the exported shape is SR-friendly for a future builder.
  - **MPR / volume viewport + crosshairs** — `createMprView` builds a 3D volume and shows it
    in three linked orthographic panes (axial / coronal / sagittal) with a `CrosshairsTool`.
    The layout selector gains an **MPR** entry for volume-capable series (multi-slice CT / MR /
    PT / NM); the stack grid stays mounted (hidden) so switching back is instant. `isVolumeCapable`
    gates the option. Rendering and crosshair sync require a real WebGL browser; unit tests
    cover the wiring and gating only.
  - Internal: shared viewport-capture helpers moved to `cornerstone/capture.ts`.

- [#1](https://github.com/docorbitapp/orbidicom/pull/1) [`c3b0f9f`](https://github.com/docorbitapp/orbidicom/commit/c3b0f9f84faad92f6b5f645299c73bbffaacd04f) Thanks [@gasci](https://github.com/gasci)! - Download the active slice as a JPEG (image + measurements).

  - `@orbidicom/core`: new `StackHandle.captureSliceJpeg(quality?)` composites the rendered
    viewport canvas with its annotation SVG overlay into an opaque JPEG `Blob`. The patient
    metadata overlay is a separate DOM layer and is never burned in. Returns `null` for
    report/SR/PDF cells (nothing to capture).
  - `@orbidicom/vue`: a toolbar **Download image as JPEG** button (shown only when the active
    cell holds an image stack) saves `<series>_<slice>.jpg` — image plus any length/angle/ROI
    measurements, no patient text. Localized in all 10 languages.

- [#1](https://github.com/docorbitapp/orbidicom/pull/1) [`c3b0f9f`](https://github.com/docorbitapp/orbidicom/commit/c3b0f9f84faad92f6b5f645299c73bbffaacd04f) Thanks [@gasci](https://github.com/gasci)! - 3D volume rendering (VR) in the MPR view — an OHIF-style hanging protocol.

  - **`@orbidicom/core`** — `createMprView` now builds a four-up reconstruction: the three
    orthographic planes (axial / coronal / sagittal, crosshairs) plus a **3D volume-rendering
    pane** on a `VOLUME_3D` viewport with `TrackballRotate`. New exports `VR_PRESETS` (a curated
    set of Cornerstone transfer-function presets — CT-Bone, CT-Soft-Tissue, CT-Lung, CT-Muscle,
    CT-Cardiac, CT-MIP, MR-Default, MR-Angio, MR-MIP) and `defaultVrPreset(modality)`. The handle
    gains `setPreset(name)`; `setVolume` takes an optional `{ modality }` to light the 3D pane with
    a sensible default. The 3D pane and the orthographic planes use separate per-instance tool
    groups, both torn down (and the shared volume evicted) on `destroy`.
  - **`@orbidicom/vue`** — the MPR layout renders as a 2×2 grid with the 3D pane and a floating
    rendering-preset picker; the layout option reads "MPR / 3D". The option is now always listed
    in the layout dropdown but **disabled with an explanatory tooltip** when the active series
    isn't volume-capable (instead of being hidden), so the capability is discoverable.
  - **NIfTI is now MPR / 3D-eligible** — `SeriesSummary` gains an optional `volumetric` flag, set
    by `NiftiDataSource`, and `isVolumeCapable` honors it. NIfTI volumes carry no DICOM modality,
    so they were previously excluded from reconstruction; they now build through the same
    streaming-volume path (the default VR preset falls back to CT-Bone).
  - Rendering, crosshair reslice, and VR correctness require a real WebGL browser and a true
    volumetric series — unit tests cover wiring, preset/tool plumbing, and the `isVolumeCapable`
    gate only. A real-browser QA pass is still needed before release.

- [#1](https://github.com/docorbitapp/orbidicom/pull/1) [`c3b0f9f`](https://github.com/docorbitapp/orbidicom/commit/c3b0f9f84faad92f6b5f645299c73bbffaacd04f) Thanks [@gasci](https://github.com/gasci)! - Keyboard shortcuts, a modality-aware window-level preset engine, and six more UI languages.

  - **Keyboard shortcuts** — a framework-agnostic keymap (`DEFAULT_KEYMAP`, `resolveHotkey`) in
    `@orbidicom/core`, wired into `<Viewer>`: letter keys select tools, `i`/`r`/`f`/`0` run view
    transforms, space toggles cine, arrows page slices, and digits `1`–`9` apply window presets.
    Bindings are shown in the toolbar tooltips and can be overridden via the new `keymap` prop.
  - **W/L preset engine** — `windowPresetsFor` is no longer CT-only. CT still ships its five
    standard windows, but a host can register protocol windows for **any** modality via
    `registerWindowPreset` (matched case-insensitively) and they surface in the toolbar.
  - **More languages** — the UI now ships **10 locales** (added Français, Italiano, Português,
    Русский, 中文, 日本語 alongside English, Türkçe, Deutsch, Español), with the live switcher
    and English fallback for any missing key.

- [#2](https://github.com/docorbitapp/orbidicom/pull/2) [`eaee06d`](https://github.com/docorbitapp/orbidicom/commit/eaee06d3566c48204b78dd52488a43b8ab3ccb1d) Thanks [@gasci](https://github.com/gasci)! - Tier 2: a Plugin SDK and lightweight hanging protocols.

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

## 0.3.1

## 0.3.0

### Minor Changes

- LocalDataSource now renders encapsulated-PDF reports from local `.dcm` files. Previously
  only the DICOMweb source handled encapsulated PDFs; the local reader dropped any instance
  without PixelData at ingestion, so a PDF report opened offline (`npx orbidicom`, drag-drop)
  silently vanished. `LocalDataSource` now detects encapsulated PDFs (Encapsulated PDF Storage
  SOP class, or any instance carrying an `EncapsulatedDocument` `0042,0011`), retains their
  bytes, advertises `capabilities.encapsulatedPdf`, and implements `listPdfs` / `getPdfObjectUrl`
  — matching the DICOMweb contract, so the viewer renders them with no UI change.

- Render DICOM Structured Reports (SR). SR series are no longer filtered out — they're
  parsed into a normalized `SrTree` and shown as a readable, indented document. The
  `DataSource` interface gains a generalized report surface (`listReports`,
  `getStructuredReport`, `ReportInstance`, `capabilities.reports`) alongside the
  existing PDF hooks; `DicomWebDataSource` parses the SR Content Sequence already inline
  in WADO-RS metadata (no extra fetch). The new `SrView` renders the tree with escaped
  interpolation (no `v-html`), themed from CSS tokens, with SR error/placeholder i18n in
  all four locales. Core text value types (CONTAINER/TEXT/NUM/CODE/DATE/TIME/PNAME/UIDREF)
  render fully; spatial/image/waveform types show a labeled placeholder for now.

## 0.2.1

### Patch Changes

- Maintenance release. Republishes the encapsulated-PDF support from 0.2.0 (whose release run did not complete publishing); no source changes. CI builds the container image amd64-only (emulated arm64 was prohibitively slow).

## 0.2.0

### Minor Changes

- Render encapsulated-PDF report series. `DicomWebDataSource` gains `getPdfObjectUrl()` (WADO-RS bulk fetch with multipart unwrap, rebased onto the configured root, honoring cookie/bearer auth), and the `<Viewer>` shows a `PdfView` (lazy-loaded pdf.js) for PDF-only series instead of an empty cell. New `PdfInstance` type and optional `DataSource.listPdfs` / `getPdfObjectUrl` hooks.

## 0.1.0

### Minor Changes

- [`97ae566`](https://github.com/docorbitapp/orbidicom/commit/97ae5662c7dfe547ca2d1449885405da8b1dd154) Thanks [@gasci](https://github.com/gasci)! - Port the headless DICOM engine: Cornerstone init/stack, WADO-RS image IDs,
  window presets, and pluggable DicomWeb + Local data sources.
