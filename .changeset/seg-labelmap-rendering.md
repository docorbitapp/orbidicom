---
"@orbidicom/core": minor
"@orbidicom/vue": minor
---

Add read-only DICOM-SEG labelmap rendering (2D stack). Segmentations discovered in
a series can be toggled on/off as colored labelmap overlays.

- core: `DataSource.getSegmentation` fetches a SEG's PixelData via WADO-RS bulkdata
  and decodes it (using the existing SEG parser) into per-source-image labelmaps
  (`DicomWebDataSource` implementation, with the SEG metadata cached during
  `getImageIds`). `seg/align.ts` pairs labelmaps to a viewport's stack by SOP UID,
  and `cornerstone/seg.ts` (`StackHandle.showSegmentation` / `hideSegmentation`)
  draws them as a Cornerstone stack labelmap with each segment's display color.
- vue: a "Segmentations" sidebar list for the active series with per-SEG toggles;
  `segmentations` string in all 20 locales.

The data + orchestration layers are unit-tested; the WebGL render itself needs
real-browser verification — see `docs/seg-rendering-qa.md`. MPR/volume rendering
and brush/threshold editing remain future work.
