---
"@orbidicom/vue": minor
"orbidicom": minor
---

Five more UI languages and a searchable language switcher.

- **15 built-in languages** — adds Korean (`ko`), Hindi (`hi`), Indonesian (`id`), Dutch
  (`nl`), and Polish (`pl`) to the existing ten, all with the full key set (the runtime
  key-parity test guards against gaps).
- **Searchable `LangSwitcher`** — the native `<select>` is replaced by an accessible combobox:
  a trigger showing the active language opens a popover with a type-to-filter search
  (diacritic-insensitive, also matches the locale code), keyboard navigation, and
  click-outside / Escape to dismiss.
- Right-to-left scripts (Arabic, Hebrew) are intentionally a follow-up — they need UI
  mirroring beyond a string table.
