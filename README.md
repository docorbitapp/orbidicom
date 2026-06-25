# OrbiDICOM

A **modern**, **mobile-responsive**, lightweight, extensible **Vue 3** DICOM viewer that plugs
into **any PACS** — Orthanc, dcm4chee, Google Healthcare, or a proxy — and also runs **fully
offline** on local `.dcm`/`.nii` files.

Built mobile-first: a touch-friendly, responsive UI that works everywhere from a phone to a
4K reading station — selectable 1–10-up grids, an on-image metadata overlay with a privacy
(blur) mode for demos, a DICOM metadata reader, cine playback, and W/L presets. The interface
is **multilingual** with a built-in live language switcher (English, Türkçe, Deutsch, Español).
It's also **easy to deploy** — Kubernetes-ready with its own **Helm chart** and container image,
runnable in a single command.

## Try it in one command

```bash
npx orbidicom
```

Opens the viewer in your browser in **local mode** — drag in `.dcm` files, no server required.
Point it at a PACS:

```bash
npx orbidicom --pacs https://your-dicomweb-endpoint/dicom-web
```

## Use it in your app

```bash
npm create orbidicom@latest
```

Scaffolds a configured viewer you can theme, translate, and embed. See the
[docs](./docs) and [CONTRIBUTING](./CONTRIBUTING.md).

## Deploy to Kubernetes

OrbiDICOM is **Kubernetes-ready** with a container image and a bundled **Helm
chart** — one command to run, local-file-only or connected to a PACS:

```bash
helm install orbidicom ./helm/orbidicom \
  --set pacs.proxy.upstream=http://orthanc.pacs.svc.cluster.local:8042/dicom-web
```

The chart includes a same-origin DICOMweb reverse proxy (no CORS setup, PACS
stays in-cluster), ingress + TLS, autoscaling, and non-root hardening. The PACS
endpoint is set at container start, so one image serves any deployment. Full
guide: [docs/deploy.md](./docs/deploy.md).

## Packages

| Package           | What it is                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@orbidicom/core` | Framework-agnostic engine: Cornerstone3D setup, `DataSource` interface, DICOMweb + local adapters, auth strategies, tool/preset registry |
| `@orbidicom/vue`  | Vue 3 UI components, theming, i18n, plugin host                                                                                          |
| `orbidicom`       | CLI: `npx orbidicom` (run), `npm create orbidicom` (scaffold), `orbidicom ai` (optional assistant)                                       |

## License

MIT © OrbiDICOM contributors
