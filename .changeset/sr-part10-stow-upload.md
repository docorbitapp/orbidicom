---
"@orbidicom/core": minor
"@orbidicom/vue": minor
---

Add DICOM-SR Part-10 encoding + STOW-RS upload. Measurements can now be uploaded
to a store-capable PACS as a Comprehensive SR.

- core: `dicomJsonToPart10` — a small, dependency-free Explicit-VR-Little-Endian
  Part-10 writer (preamble + generated File Meta Information + dataset, including
  nested sequences) that encodes the DICOM-JSON from `buildMeasurementSr`. Verified
  by round-tripping through `dicom-parser`.
- vue: a capability-gated "Upload SR" toolbar button (shown when the source
  advertises `store` and measurements exist) with a confirm + result dialog;
  `uploadSr`/`confirmUploadSr`/`upload`/`srUploaded`/`srUploadFailed` strings in
  all 20 locales. Uploads via the existing `DataSource.storeInstances` (STOW-RS).
