# @orbidicom/core

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
