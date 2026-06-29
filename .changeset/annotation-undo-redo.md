---
"@orbidicom/core": minor
"@orbidicom/vue": minor
---

Add annotation undo/redo. Create and delete of measurements can now be stepped
back and forward via Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y (redo),
and two new toolbar buttons that disable when their stack is empty.

- core: new `annotationHistory` controller + `startAnnotationHistory()`
  (command/inverse history over Cornerstone's global annotation state), a pure
  `resolveEditCommand` hotkey helper, and `StackHandle.refreshAnnotations()`.
- vue: undo/redo toolbar buttons, keyboard shortcuts, and `undo`/`redo` strings
  in all 20 locales.

Clear-all resets the history (it is a deliberate bulk action, not an undoable
step); loading a new series set also resets it. Moving/resizing an existing
annotation is not a discrete history step, but such edits are preserved across
an undo→redo round trip.
