# @orbidicom/vue

Vue 3 UI for [OrbiDICOM](https://github.com/docorbitapp/orbidicom) — a modern, mobile-responsive,
multilingual DICOM viewer. Components: `Viewer`, `Toolbar`, `SeriesRail`, `MetaPanel`,
`LangSwitcher`, `Controls`, plus live i18n (EN/TR/DE/ES) and CSS-variable theming.

> This package ships Vue single-file components as **source**. You need a Vue 3 + bundler
> (Vite, etc.) toolchain that can compile `.vue`/`.ts` from `node_modules`.

## Install

```sh
npm install @orbidicom/vue @orbidicom/core vue
```

## Usage

```ts
import { Viewer, Toolbar, setLang } from "@orbidicom/vue";
import "@orbidicom/vue/theme.css";
```

## License

MIT
