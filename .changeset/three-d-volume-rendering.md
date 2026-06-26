---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

3D volume rendering (VR) in the MPR view — an OHIF-style hanging protocol.

- **`@orbidicom/core`** — `createMprView` now builds a four-up reconstruction: the three
  orthographic planes (axial / coronal / sagittal, crosshairs) plus a **3D volume-rendering
  pane** on a `VOLUME_3D` viewport with `TrackballRotate`. New exports `VR_PRESETS` (a curated
  set of Cornerstone transfer-function presets — CT-Bone, CT-Soft-Tissue, CT-Lung, CT-Muscle,
  CT-Cardiac, CT-MIP, MR-Default, MR-Angio, MR-MIP) and `defaultVrPreset(modality)`. The handle
  gains `setPreset(name)`; `setVolume` takes an optional `{ modality }` to light the 3D pane with
  a sensible default. The 3D pane and the orthographic planes use separate per-instance tool
  groups, both torn down (and the shared volume evicted) on `destroy`.
- **`@orbidicom/vue`** — the MPR layout renders as a 2×2 grid with the 3D pane and a floating
  rendering-preset picker; the layout option reads "MPR / 3D".
- Rendering, crosshair reslice, and VR correctness require a real WebGL browser and a true
  volumetric series — unit tests cover wiring, preset/tool plumbing, and the `isVolumeCapable`
  gate only. A real-browser QA pass is still needed before release.
