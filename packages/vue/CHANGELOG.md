# @orbidicom/vue

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @orbidicom/core@0.3.1

## 0.3.0

### Minor Changes

- Render DICOM Structured Reports (SR). SR series are no longer filtered out — they're
  parsed into a normalized `SrTree` and shown as a readable, indented document. The
  `DataSource` interface gains a generalized report surface (`listReports`,
  `getStructuredReport`, `ReportInstance`, `capabilities.reports`) alongside the
  existing PDF hooks; `DicomWebDataSource` parses the SR Content Sequence already inline
  in WADO-RS metadata (no extra fetch). The new `SrView` renders the tree with escaped
  interpolation (no `v-html`), themed from CSS tokens, with SR error/placeholder i18n in
  all four locales. Core text value types (CONTAINER/TEXT/NUM/CODE/DATE/TIME/PNAME/UIDREF)
  render fully; spatial/image/waveform types show a labeled placeholder for now.

### Patch Changes

- Updated dependencies []:
  - @orbidicom/core@0.3.0

## 0.2.1

### Patch Changes

- Maintenance release. Republishes the encapsulated-PDF support from 0.2.0 (whose release run did not complete publishing); no source changes. CI builds the container image amd64-only (emulated arm64 was prohibitively slow).

- Updated dependencies []:
  - @orbidicom/core@0.2.1

## 0.2.0

### Minor Changes

- Render encapsulated-PDF report series. `DicomWebDataSource` gains `getPdfObjectUrl()` (WADO-RS bulk fetch with multipart unwrap, rebased onto the configured root, honoring cookie/bearer auth), and the `<Viewer>` shows a `PdfView` (lazy-loaded pdf.js) for PDF-only series instead of an empty cell. New `PdfInstance` type and optional `DataSource.listPdfs` / `getPdfObjectUrl` hooks.

### Patch Changes

- Updated dependencies []:
  - @orbidicom/core@0.2.0

## 0.1.0

### Minor Changes

- [`97ae566`](https://github.com/docorbitapp/orbidicom/commit/97ae5662c7dfe547ca2d1449885405da8b1dd154) Thanks [@gasci](https://github.com/gasci)! - Port the viewer UI (Viewer, Toolbar, SeriesRail) onto @orbidicom/core's
  DataSource, de-branded with neutral theme tokens. The demo now renders
  local .dcm files.

### Patch Changes

- Updated dependencies [[`97ae566`](https://github.com/docorbitapp/orbidicom/commit/97ae5662c7dfe547ca2d1449885405da8b1dd154)]:
  - @orbidicom/core@0.1.0
