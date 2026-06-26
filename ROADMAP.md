# Roadmap

## Now (v1.x) — clean, embeddable 2D viewer

- 2D stack viewer with the full tool set (W/L + presets, zoom/pan/rotate/flip/invert,
  length/angle/bidirectional/ROIs/probe, cine, grids, series rail)
- `DataSource` interface + DICOMweb adapter + local-files adapter; pluggable auth
- Theming, i18n, `npx orbidicom`, `npm create orbidicom`, optional `orbidicom ai`

## Next

Sequenced against OHIF's feature breadth, but scoped to keep OrbiDICOM thin, embeddable,
and offline-capable. Tier 1 closes the highest-value clinical gaps; Tier 2/3 are the
differentiators.

### Tier 1 — clinical table-stakes (in progress)

- [x] **W/L preset engine + hotkeys** — modality-aware, host-extensible preset engine
      (`core/src/presets.ts`) + a framework-agnostic keymap (`core/src/hotkeys.ts`) wired
      into the viewer, with shortcuts shown in the toolbar tooltips. _Shipped._
- [x] **Download slice as JPEG** — `StackHandle.captureSliceJpeg` composites the rendered
      image with the annotation SVG overlay (no patient overlay text); toolbar button +
      `<series>_<slice>.jpg`. _Shipped._
- [x] **MPR + 3D volume rendering** — `createMprView` builds a volume and shows it in an
      OHIF-style 2×2 hanging protocol: three orthographic planes (axial / coronal / sagittal)
      plus a 3D volume-rendering (VR) pane with selectable transfer-function presets
      (CT-Bone, CT-Soft-Tissue, CT-Lung, MR-Default, MIP, …) and trackball rotation, gated to
      volume-capable series. The stack grid stays mounted (hidden) underneath. _Shipped
      (rendering/crosshair/VR sync needs real-browser QA)._
- [x] **Crosshairs** — `CrosshairsTool` links the three MPR planes. _Shipped._ (Standalone
      reference lines for the stack grid remain a follow-up.)
- [x] **Measurement export** — `collectMeasurements` + JSON/CSV export of Length/Angle/ROI/
      Probe from the toolbar. _Shipped._ DICOM-SR _generation_ is deferred (needs a Part-10
      writer + STOW-RS upload); the exported shape is SR-friendly for that future builder.

### Tier 2 — differentiators that fit the thin + pluggable identity

1. **Plugin SDK** — public tool/panel/data-source plugin API (formalize the registry).
2. **DICOM-SEG display** — labelmap rendering (read-only first), then brush/threshold edit.
3. **Hanging protocols (lightweight)** — auto-arrange series by modality into the grid;
   reuses the existing grid + series rail.
4. **More data sources** — STOW-RS upload, DIMSE adapter, DICOM-JSON, cloud adapters as
   separate packages (all additive `DataSource` implementations, no UI branching).
5. **Study list / worklist** — QIDO-RS study search instead of jumping straight to one study.

### Tier 3 — AI (the real differentiator)

1. **Wire the `ai` CLI command** (currently a stub) — AI-assisted measurement, auto-W/L,
   report drafting from SR, or natural-language study navigation.

### Quick wins (anytime)

- Light theme, RTL locales (Arabic / Hebrew — needs UI mirroring), key-image flagging,
  annotation undo/redo, colormaps/LUTs for PET/MR.
- [x] **15 UI languages + searchable switcher** — en · tr · de · es · fr · it · pt · ru ·
      zh · ja · ko · hi · id · nl · pl, with a filterable language picker. _Shipped._
- [x] **3D VR / MIP with transfer-function presets** — shipped as part of MPR + 3D above.

## In scope

Web-based DICOM viewing, standard DICOMweb/PACS connectivity, extensibility (tools, themes,
data sources, locales), embeddability.

## Out of scope (for now)

A full PACS server, DICOM storage/routing, non-web/native viewers, modality-specific clinical
workflows. Propose anything here as a `proposal` issue and we'll discuss.
