---
"@orbidicom/vue": patch
---

Fix: the cine-speed dropdown now tracks the active grid cell's own fps. In a
multi-cell grid, autoplaying one cell at 10fps and another at 20fps left the
dropdown showing a single shared value, so switching the active cell no longer
reflected that cell's playback speed. Cine speed is now stored per cell.
