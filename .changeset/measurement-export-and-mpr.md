---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Measurement export and an MPR / volume viewport — the rest of Tier 1.

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
