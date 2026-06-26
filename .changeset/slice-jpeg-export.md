---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Download the active slice as a JPEG (image + measurements).

- `@orbidicom/core`: new `StackHandle.captureSliceJpeg(quality?)` composites the rendered
  viewport canvas with its annotation SVG overlay into an opaque JPEG `Blob`. The patient
  metadata overlay is a separate DOM layer and is never burned in. Returns `null` for
  report/SR/PDF cells (nothing to capture).
- `@orbidicom/vue`: a toolbar **Download image as JPEG** button (shown only when the active
  cell holds an image stack) saves `<series>_<slice>.jpg` — image plus any length/angle/ROI
  measurements, no patient text. Localized in all 10 languages.
