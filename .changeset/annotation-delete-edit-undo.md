---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Add a per-annotation **×** overlay to delete a single measurement directly in the viewport, and make annotation **delete** and **move/resize edits** undoable/redoable via the existing undo/redo (Ctrl/Cmd+Z, toolbar). Core gains `deleteAnnotation`, `getAnnotationDeleteTargets`, and `StackHandle.getViewport()`; the history controller records `edit` steps coalesced to one per drag gesture.
