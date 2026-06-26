---
"@orbidicom/core": minor
"@orbidicom/vue": minor
"orbidicom": minor
---

Keyboard shortcuts, a modality-aware window-level preset engine, and six more UI languages.

- **Keyboard shortcuts** — a framework-agnostic keymap (`DEFAULT_KEYMAP`, `resolveHotkey`) in
  `@orbidicom/core`, wired into `<Viewer>`: letter keys select tools, `i`/`r`/`f`/`0` run view
  transforms, space toggles cine, arrows page slices, and digits `1`–`9` apply window presets.
  Bindings are shown in the toolbar tooltips and can be overridden via the new `keymap` prop.
- **W/L preset engine** — `windowPresetsFor` is no longer CT-only. CT still ships its five
  standard windows, but a host can register protocol windows for **any** modality via
  `registerWindowPreset` (matched case-insensitively) and they surface in the toolbar.
- **More languages** — the UI now ships **10 locales** (added Français, Italiano, Português,
  Русский, 中文, 日本語 alongside English, Türkçe, Deutsch, Español), with the live switcher
  and English fallback for any missing key.
