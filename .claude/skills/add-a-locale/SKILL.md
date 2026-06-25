---
name: add-a-locale
description: Translate the OrbiDICOM UI into a new language.
---

# Add a locale

1. Copy the `en` dictionary (in `packages/vue`) to a new locale code, e.g. `de`.
2. Translate each string value; keep keys identical.
3. Register the locale in your app config.
4. `make lint`, changeset, PR.
