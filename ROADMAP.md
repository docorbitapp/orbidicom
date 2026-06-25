# Roadmap

## Now (v1.x) — clean, embeddable 2D viewer

- 2D stack viewer with the full tool set (W/L + presets, zoom/pan/rotate/flip/invert,
  length/angle/bidirectional/ROIs/probe, cine, grids, series rail)
- `DataSource` interface + DICOMweb adapter + local-files adapter; pluggable auth
- Theming, i18n, `npx orbidicom`, `npm create orbidicom`, optional `orbidicom ai`

## Next

1. **Plugin SDK** — public tool/panel/data-source plugin API
2. **MPR** — volume loader + 3-plane orthographic viewports with crosshairs
3. **3D VR / MIP** — volume rendering with transfer-function presets
4. **Segmentation** — labelmap rendering + brush/threshold tools
5. **Annotation persistence** — DICOM SR/SEG via STOW-RS (or pluggable store)
6. **More data sources** — DICOM-JSON, cloud adapters as separate packages

## In scope

Web-based DICOM viewing, standard DICOMweb/PACS connectivity, extensibility (tools, themes,
data sources, locales), embeddability.

## Out of scope (for now)

A full PACS server, DICOM storage/routing, non-web/native viewers, modality-specific clinical
workflows. Propose anything here as a `proposal` issue and we'll discuss.
