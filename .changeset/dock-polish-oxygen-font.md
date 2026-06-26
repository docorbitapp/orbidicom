---
"@orbidicom/vue": patch
---

Refine the bottom-left controls dock and make Oxygen the project face.

- `theme.css` now sets `--font` to an `"Oxygen", system-ui, …` stack and applies it on the
  `.orbidicom` root, so the whole viewer renders in Oxygen (hosts load the web font; it
  degrades cleanly to the system stack when absent).
- The dock aligns its host action button and the language field to one full-width, 36px
  rhythm; the language switcher gets a cleaner standard globe, a custom chevron, and a visible
  focus ring; the slice hint gains a small scroll glyph and tidier type.
