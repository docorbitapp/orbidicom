---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Tier 2 data-source + segmentation groundwork, plus five more UI languages with RTL support.

**Core (`@orbidicom/core`)**

- **QIDO-RS worklist** — `DataSource.searchStudies(query?)` returning `StudySummary[]`, with a
  `StudyQuery` filter (patient, accession, date, modality, paging). Implemented for DICOMweb
  (`capabilities.studySearch`). PatientName is reduced to its Alphabetic component.
- **STOW-RS upload** — `DataSource.storeInstances(files, { studyUid? })` returning a `StoreResult`
  (`stored` / `failed`). DICOMweb POSTs a single `multipart/related; type="application/dicom"`
  body and parses the Store-Instances response (`capabilities.store`).
- **DICOM-JSON data source** — a new in-memory `DicomJsonDataSource` (registered as the
  `dicomjson` factory) that serves series + frame-expanded WADO-RS image ids + per-image
  metadata from a DICOM-JSON document, no QIDO/WADO round-trip.
- **DICOM-SEG (read-only parsing)** — `core/src/seg/parse.ts`: SOP-class detection, segment
  definitions (labels, property codes, Recommended-Display-CIELab → sRGB color), per-frame →
  segment/source-image mapping, and BINARY-bitstream decode. DICOMweb routes SEG instances out
  of the image stack and exposes them via `listSegmentations` (`capabilities.segmentations`).
  The WebGL labelmap render remains a real-browser-QA follow-up.

**Vue (`@orbidicom/vue`)**

- **Five more UI languages** — Arabic (`ar`), Persian (`fa`), Bengali (`bn`), Vietnamese (`vi`),
  Ukrainian (`uk`) — taking the built-in set to 20.
- **Right-to-left support** — `isRtl` / `dir` helpers; `<Viewer>` mirrors its layout via a `dir`
  attribute that follows the active language (Arabic, Persian).
- **Language picker** now opens toward whichever side has more room, so it is no longer clipped
  at the top of the viewport on mobile.
