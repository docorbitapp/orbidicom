---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

DICOM-SR measurement export, a worklist UI, and more segmentation groundwork.

**Core (`@orbidicom/core`)**

- **DICOM-SR generation** — `buildMeasurementSr` (`sr/to-json.ts`) turns collected
  `Measurement`s into a Comprehensive SR (TID-1500-flavored, DICOM-JSON) with a Measurement
  Group per annotation and a coded NUM item per statistic (SCT/DCM concepts, UCUM units). It
  round-trips through the existing `srTreeFromJson` reader; encoding to Part-10 (dcmjs) for
  STOW-RS upload is the remaining host-side step.
- **SEG labelmap assembly** — `buildSegLabelmaps` merges the decoded per-frame SEG masks into one
  segment-number raster per source image (the render-ready data the WebGL labelmap will consume).

**Vue (`@orbidicom/vue`)**

- **`<StudyList>` worklist component** — a patient / ID / accession / modality filter form →
  results table that emits `open(studyInstanceUID)`, driven by a `DataSource`'s `searchStudies`
  (capability-gated, RTL-aware). Adds nine worklist UI strings across all 20 locales.
- Exposes the `isRtl` / `dir` i18n helpers from the package entry point.
