---
"@orbidicom/core": minor
"@orbidicom/vue": minor
---

Add key-image flagging. Mark/unmark the current slice as a key image via a star
toolbar toggle (with a count badge) or the `k` hotkey, and export the flagged
slices as JSON.

- core: `KeyImage` type + `keyImagesToJson` serializer (provenance envelope,
  mirrors the measurement export), and a `keyImage` hotkey command bound to `k`.
- vue: star toggle + count badge + capability-gated key-images export button;
  `flagKeyImage`/`keyImages` strings in all 20 locales. Flags reset when a new
  series set loads.
