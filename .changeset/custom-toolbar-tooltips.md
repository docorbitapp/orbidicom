---
"@orbidicom/vue": patch
---

Toolbar controls now show a custom, themed hover tooltip instead of the slow,
OS-styled native `title`. The chip is teleported to `<body>` (so the toolbar's
horizontal scroll can't clip it) and displays the action's keyboard shortcut as
keycaps. It appears on mouse hover and keyboard focus only — never on touch — and
respects `prefers-reduced-motion`. Labels are mirrored to `aria-label`, so
icon-only buttons keep an accessible name.
