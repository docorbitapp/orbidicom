<template>
  <div class="toolbar">
    <!-- Mobile-only: hamburger that toggles the controls menu (language, host
         actions, hint). In normal flow, right before the title. -->
    <button
      class="toolbar__menu"
      :class="{ 'toolbar__menu--active': menuOpen }"
      :title="t('menu')"
      :aria-expanded="menuOpen ?? false"
      @click="$emit('toggleMenu')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h16" />
        <path v-else d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
    <span class="toolbar__title">{{ title ?? "OrbiDICOM" }}</span>
    <div class="toolbar__sep" />

    <!-- W/L presets only exist for CT; hidden for other modalities. -->
    <template v-if="presets.length">
      <label class="wl">
        <span class="wl__label">W/L</span>
        <select
          class="wl__select"
          :value="''"
          :title="t('presetTitle')"
          @change="onPreset(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>{{ t("preset") }}</option>
          <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
        </select>
      </label>
      <div class="toolbar__sep" />
    </template>

    <!-- Active left-button tool (one at a time). -->
    <div class="toolbar__group">
      <button
        v-for="tool in toolButtons"
        :key="tool.name"
        class="tbtn"
        :class="{ 'tbtn--active': activeTool === tool.name }"
        :title="toolTitle(tool)"
        @click="$emit('tool', tool.name)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- tool.icon is static, trusted SVG markup defined in this file -->
        <svg viewBox="0 0 24 24" v-html="tool.icon" />
      </button>
      <button class="tbtn" :title="t('clearMeasurements')" @click="$emit('clearAnnotations')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
        </svg>
      </button>
    </div>

    <div class="toolbar__sep" />

    <div class="toolbar__group">
      <button
        class="tbtn"
        :title="withKey(t('invert'), actionHotkey.invert)"
        @click="$emit('invert')"
      >
        <svg viewBox="0 0 24 24">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path d="M3 21 21 3" stroke="currentColor" stroke-width="1.6" />
          <path d="M3 21V3h18z" fill="currentColor" />
        </svg>
      </button>
      <button
        class="tbtn"
        :title="withKey(t('rotate'), actionHotkey.rotate)"
        @click="$emit('rotate')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v4h-4" />
        </svg>
      </button>
      <button class="tbtn" :title="withKey(t('flip'), actionHotkey.flipH)" @click="$emit('flipH')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M8 7l-4 5 4 5" />
          <path d="M16 7l4 5-4 5" />
        </svg>
      </button>
      <button class="tbtn" :title="withKey(t('reset'), actionHotkey.reset)" @click="$emit('reset')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
      </button>
    </div>

    <div class="toolbar__sep" />

    <!-- Grid layout: 1×1 .. 2×5 (1/2/4/6/8/10 viewports). -->
    <label class="layout" :title="t('layout')">
      <svg
        class="layout__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
      >
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
      <select
        class="layout__select"
        :value="mprActive ? 'mpr' : String(layout)"
        @change="onLayoutChange(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="opt in layoutOptions"
          :key="opt.n"
          :value="String(opt.n)"
          :disabled="opt.disabled"
          :title="opt.disabled ? t('mprFailed') : undefined"
        >
          {{ opt.label }}
        </option>
      </select>
    </label>

    <!-- Cycle the on-image overlay: full info -> patient data blurred -> hidden. -->
    <button
      class="tbtn tbtn--overlay"
      :class="{ 'tbtn--active': mode !== 'off', 'tbtn--privacy': mode === 'private' }"
      :title="overlayTitle"
      @click="$emit('cycleOverlay')"
    >
      <!-- full: info circle -->
      <svg
        v-if="mode === 'full'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <!-- private: shield (patient data protected) -->
      <svg
        v-else-if="mode === 'private'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <!-- off: eye with slash (overlay hidden) -->
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M3 3l18 18" />
      </svg>
    </button>

    <!-- Open the full DICOM metadata reader panel. -->
    <button class="tbtn tbtn--meta" :title="t('metadataTitle')" @click="$emit('openMeta')">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h4M7 13h10M7 17h10" />
      </svg>
    </button>

    <template v-if="canDownload">
      <div class="toolbar__sep" />
      <button
        class="tbtn tbtn--download"
        :title="t('downloadStudy')"
        @click="$emit('downloadStudy')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
        </svg>
      </button>
    </template>

    <!-- Save the active slice (image + measurements) as a JPEG. Hidden for
         report cells / cells with no image stack. -->
    <template v-if="canDownloadImage">
      <div class="toolbar__sep" />
      <button
        class="tbtn tbtn--download-image"
        :title="t('downloadImage')"
        @click="$emit('downloadImage')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m21 16-5-5-4 4-2-2-4 4" />
        </svg>
      </button>
    </template>

    <!-- Export the drawn measurements as JSON or CSV. Hidden when there are none. -->
    <template v-if="canExportMeasurements">
      <div class="toolbar__sep" />
      <div class="toolbar__group tbtn--export-measurements">
        <button
          class="tbtn"
          :title="t('exportMeasurementsJson')"
          @click="$emit('exportMeasurements', 'json')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6" />
            <text
              x="12"
              y="18"
              text-anchor="middle"
              font-size="6"
              fill="currentColor"
              stroke="none"
            >
              {}
            </text>
          </svg>
        </button>
        <button
          class="tbtn"
          :title="t('exportMeasurementsCsv')"
          @click="$emit('exportMeasurements', 'csv')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6" />
            <path d="M8 16h2M12 16h2M16 16h0.5" />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { windowPresetsFor, type WlPreset, TOOLS, DEFAULT_KEYMAP } from "@orbidicom/core";
import { t, type I18nKey } from "../i18n";

const props = defineProps<{
  modality: string;
  activeTool: string;
  layout: number;
  /** Overlay cycle state: full info, patient data blurred, or hidden. */
  overlayMode?: "full" | "private" | "off";
  /** Whether the mobile controls menu is open (for the hamburger state). */
  menuOpen?: boolean;
  title?: string;
  canDownload?: boolean;
  /** Whether the active cell holds a rendered image stack that can be exported. */
  canDownloadImage?: boolean;
  /** Whether any measurements exist to export. */
  canExportMeasurements?: boolean;
  /** Whether the active series can be reconstructed in 3D (adds the MPR layout). */
  canMpr?: boolean;
  /** Whether the viewer is currently in MPR mode (so the selector shows "MPR"). */
  mprActive?: boolean;
}>();
const emit = defineEmits<{
  preset: [WlPreset];
  tool: [string];
  invert: [];
  rotate: [];
  flipH: [];
  reset: [];
  clearAnnotations: [];
  setLayout: [number | "mpr"];
  cycleOverlay: [];
  openMeta: [];
  toggleMenu: [];
  downloadStudy: [];
  downloadImage: [];
  exportMeasurements: ["json" | "csv"];
}>();

const mode = computed(() => props.overlayMode ?? "full");
const overlayTitle = computed(() =>
  mode.value === "full"
    ? t("overlayFull")
    : mode.value === "private"
      ? t("overlayPrivate")
      : t("overlayOff"),
);

// Selectable viewport grids: cell count -> rows×cols label.
const LAYOUT_OPTIONS: { n: number; label: string }[] = [
  { n: 1, label: "1×1" },
  { n: 2, label: "1×2" },
  { n: 4, label: "2×2" },
  { n: 6, label: "2×3" },
  { n: 8, label: "2×4" },
  { n: 10, label: "2×5" },
];
// The MPR / 3D option is always listed (so it's discoverable), but disabled for
// series that can't be reconstructed — a tooltip then explains why.
const layoutOptions = computed<{ n: number | "mpr"; label: string; disabled: boolean }[]>(() => [
  ...LAYOUT_OPTIONS.map((o) => ({ ...o, disabled: false })),
  { n: "mpr", label: t("mpr"), disabled: !props.canMpr },
]);
// "mpr" stays a string sentinel; grid sizes parse to a number.
function onLayoutChange(value: string) {
  emit("setLayout", value === "mpr" ? "mpr" : Number(value));
}

// Inner SVG markup per left-tool icon (static, trusted). Titles are stored as
// i18n keys (not resolved strings) so they re-translate when the language changes.
const toolButtons: { name: string; titleKey: I18nKey; icon: string }[] = [
  {
    name: TOOLS.WindowLevel,
    titleKey: "toolWl",
    icon: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  },
  {
    name: TOOLS.Pan,
    titleKey: "toolPan",
    icon: '<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: TOOLS.Zoom,
    titleKey: "toolZoom",
    icon: '<circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M20 20l-4.3-4.3M11 8v6M8 11h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  {
    name: TOOLS.Length,
    titleKey: "toolLength",
    icon: '<path d="M3 17 17 3l4 4L7 21z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 13l2 2M11 9l2 2M15 5l2 2" stroke="currentColor" stroke-width="1.5"/>',
  },
  {
    name: TOOLS.Angle,
    titleKey: "toolAngle",
    icon: '<path d="M4 20h16M4 20 17 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  },
  {
    name: TOOLS.Rectangle,
    titleKey: "toolRect",
    icon: '<rect x="4" y="6" width="16" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  },
  {
    name: TOOLS.Ellipse,
    titleKey: "toolEllipse",
    icon: '<ellipse cx="12" cy="12" rx="8" ry="6" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  },
  {
    name: TOOLS.Probe,
    titleKey: "toolProbe",
    icon: '<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" stroke-width="1.6"/>',
  },
];

const presets = computed(() => windowPresetsFor(props.modality));
function onPreset(name: string) {
  const p = presets.value.find((x) => x.name === name);
  if (p) emit("preset", p);
}

// Reverse-lookup the built-in shortcut for each tool / view action so tooltips
// can advertise it (e.g. "Zoom (Z)"). Single-character keys only.
const toolHotkey: Record<string, string> = {};
const actionHotkey: Record<string, string> = {};
for (const [key, cmd] of Object.entries(DEFAULT_KEYMAP)) {
  if (key.length !== 1) continue;
  const k = key.toUpperCase();
  if (cmd.kind === "tool") toolHotkey[TOOLS[cmd.tool]] = k;
  else if (cmd.kind === "invert") actionHotkey.invert = k;
  else if (cmd.kind === "rotate") actionHotkey.rotate = k;
  else if (cmd.kind === "flipH") actionHotkey.flipH = k;
  else if (cmd.kind === "reset") actionHotkey.reset = k;
}
const withKey = (label: string, key?: string) => (key ? `${label} (${key})` : label);
const toolTitle = (tool: { name: string; titleKey: I18nKey }) =>
  withKey(t(tool.titleKey), toolHotkey[tool.name]);
</script>
<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: thin;
}
.toolbar__title {
  flex: none;
  /* Brand wordmark font; falls back to the theme font if Oxygen isn't loaded. */
  font-family: "Oxygen", var(--font);
  font-weight: 700;
  font-size: 13px;
  color: var(--text);
}
.toolbar__sep {
  width: 1px;
  height: 22px;
  background: var(--border);
  flex: none;
}
.toolbar__group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.tbtn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex: none;
  transition:
    background 0.12s,
    color 0.12s,
    border-color 0.12s;
}
.tbtn svg {
  width: 19px;
  height: 19px;
}
.tbtn:hover {
  background: var(--elevated);
  color: var(--text);
  border-color: var(--border);
}
.tbtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.tbtn--active {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 45%, transparent);
  border-color: var(--accent-strong);
}
/* Privacy mode: amber tint so it's obvious patient data is being blurred. */
.tbtn--privacy {
  color: #ffcf6b;
  background: color-mix(in srgb, #b9852a 35%, transparent);
  border-color: #b9852a;
}
.wl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.wl__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--hush);
  letter-spacing: 0.4px;
}
/* Custom-styled selects: drop the OS chevron for our own, with hover/focus rings
   matching the rest of the controls (LangSwitcher, buttons). */
.wl__select,
.layout__select {
  height: 34px;
  padding: 0 30px 0 10px; /* room for the chevron */
  border-radius: var(--r-sm);
  background-color: var(--elevated);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239aa7a7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 9px center;
  background-size: 14px;
  transition:
    border-color 0.12s,
    color 0.12s;
}
.wl__select:hover,
.layout__select:hover {
  border-color: color-mix(in srgb, var(--accent-strong) 45%, var(--border));
}
.wl__select:focus-visible,
.layout__select:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
  border-color: var(--accent-strong);
}
/* The opened option list (where the browser honors it). */
.wl__select option,
.layout__select option {
  background: var(--panel);
  color: var(--text);
}
/* Right-to-left: chevron + text padding flip to the left. */
[dir="rtl"] .wl__select,
[dir="rtl"] .layout__select {
  padding: 0 10px 0 30px;
  background-position: left 9px center;
}
.layout {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  color: var(--muted);
}
.layout__icon {
  width: 18px;
  height: 18px;
}
/* Mobile-only hamburger in the header, in normal flow before the title.
   Borderless ghost icon so it blends into the header (seamless, modern). */
.toolbar__menu {
  display: none;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-left: -4px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
}
.toolbar__menu svg {
  width: 21px;
  height: 21px;
}
.toolbar__menu:hover {
  color: var(--text);
  background: var(--elevated);
}
.toolbar__menu--active {
  color: var(--accent-strong);
}
@media (max-width: 640px) {
  .toolbar__menu {
    display: grid;
  }
}
</style>
