---
name: scaffold-an-app
description: Create a configured OrbiDICOM viewer app from the template.
---

# Scaffold an app

1. Run `npm create orbidicom@latest` (or `orbidicom init`).
2. Answer the prompts: data source (local / dicomweb / orthanc), endpoint, auth, theme, locales,
   base path.
3. `cd` into the generated app and `pnpm dev`.
4. Embed or deploy the built `dist/`.
