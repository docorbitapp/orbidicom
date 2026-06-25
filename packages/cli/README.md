# orbidicom

The CLI for **OrbiDICOM** — a modern, mobile-responsive, multilingual, open-source DICOM
viewer (Vue 3 + Cornerstone3D). One command serves the viewer in your browser: locally on
`.dcm`/`.nii` files, or against any DICOMweb PACS.

## Quick start

```bash
npx orbidicom
```

Opens the viewer in your browser in **local mode** — drag in `.dcm` files (or a study
folder / zip), no server required. Images, encapsulated-PDF reports, and DICOM Structured
Reports (SR) all render.

### Connect to a PACS

```bash
npx orbidicom --pacs https://your-host/dicom-web --study 1.2.840.113619…
```

`--pacs` / `--study` can also be passed at runtime via the URL
(`…/?pacs=/dicom-web&study=1.2.840…`), so one served build can open any study without a
rebuild.

### Authentication

```bash
npx orbidicom --pacs https://host/dicom-web --auth bearer --token "$TOKEN"
npx orbidicom --pacs https://host/dicom-web --auth basic --username u --password p
npx orbidicom --pacs https://host/dicom-web --auth cookie    # cross-origin session cookie
```

The default is same-origin (no `Authorization` header; same-origin cookies are still
sent). **Security:** `basic`/`bearer` credentials are embedded in the served config and
visible to the browser — only use them on trusted/internal deployments; prefer `cookie`
or a reverse proxy that injects auth server-side.

## Options

| Flag                        | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `--pacs <url>`              | DICOMweb base URL (`/dicom-web` or `https://host/…`) |
| `--study <uid>`             | Study Instance UID to auto-open on load              |
| `--auth <kind>`             | `none` (default) · `cookie` · `bearer` · `basic`     |
| `--token <t>`               | Bearer token (with `--auth bearer`)                  |
| `--username` / `--password` | Basic-auth credentials (with `--auth basic`)         |
| `--port <n>`                | Port to serve on (default `4173`)                    |
| `--open` / `--no-open`      | Open (default) / don't open the browser              |

## What you get

- Selectable 1–10-up grids, cine playback, W/L presets, length/angle/ROI tools
- On-image metadata overlay (with a privacy blur mode) and a DICOM metadata reader
- Encapsulated-PDF and DICOM Structured Report (SR) rendering
- Live language switching — English, Türkçe, Deutsch, Español
- Fully offline on local files; connects to Orthanc, dcm4chee, Google Healthcare, or a proxy

## Embed or deploy

- **In your own app:** `npm i @orbidicom/vue @orbidicom/core vue` and render `<Viewer>`.
- **Kubernetes:** a container image and a Helm chart ship with the project (same-origin
  DICOMweb proxy, ingress/TLS, autoscaling, non-root hardening).

Project, docs, and source: <https://github.com/docorbitapp/orbidicom>

## License

MIT © OrbiDICOM contributors
