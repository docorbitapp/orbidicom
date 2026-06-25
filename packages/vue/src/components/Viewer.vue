<template>
  <div class="viewer orbidicom">
    <Toolbar
      :modality="activeModality"
      :active-tool="activeTool"
      :layout="cellCount"
      :overlay-mode="overlayMode"
      :menu-open="menuOpen"
      :title="title"
      :can-download="canDownload"
      @preset="applyPreset"
      @tool="selectTool"
      @invert="onActive((s) => s.invert())"
      @rotate="onActive((s) => s.rotate())"
      @flip-h="onActive((s) => s.flipH())"
      @reset="onActive((s) => s.reset())"
      @clear-annotations="confirmClearOpen = true"
      @set-layout="setLayout"
      @cycle-overlay="cycleOverlay"
      @open-meta="openMeta"
      @toggle-menu="menuOpen = !menuOpen"
      @download-study="onDownloadStudy"
    />

    <div class="content">
      <div class="sidebar">
        <SeriesRail :series="series" :active="seriesIdx[activeCell]" @select="selectSeries" />
        <Controls :open="menuOpen">
          <!-- Host actions (e.g. a "New study" button) docked bottom-left. -->
          <slot name="actions" />
        </Controls>
      </div>

      <div class="stage">
        <!-- Non-blocking warm-up bar: the active series decodes into cache in the
             background while the user can already scroll. Floats over the stage as
             a transparent overlay so it never shifts the viewport on show/hide. -->
        <Transition name="toploader">
          <div v-if="caching" class="toploader" role="status" aria-live="polite">
            <div class="toploader__track">
              <div class="toploader__fill" :style="{ width: cachePct + '%' }" />
            </div>
            <div class="toploader__meta">
              <span class="toploader__label">
                {{ t("caching") }} {{ prefetchLoaded[activeCell] }}/{{ prefetchTotal[activeCell] }}
              </span>
              <span class="toploader__note">{{ t("cacheNote") }}</span>
            </div>
          </div>
        </Transition>

        <div class="grid" :class="gridClass">
          <div
            v-for="i in MAX_CELLS"
            :key="i"
            class="cell"
            :class="{
              'cell--active': cellCount > 1 && activeCell === i - 1,
              'cell--hidden': !isVisible(i - 1),
            }"
            @pointerdown="activeCell = i - 1"
          >
            <div :ref="(el) => setEl(i - 1, el)" class="cs-viewport" />

            <Overlay
              v-if="overlayOn && sliceCount[i - 1]"
              :meta="meta[i - 1]"
              :wl="wl[i - 1]"
              :index="sliceIndex[i - 1]"
              :count="sliceCount[i - 1]"
              :series-label="cellLabel(i - 1)"
              :privacy="overlayPrivacy"
            />

            <div v-if="cellLoading[i - 1]" class="loading">
              <span class="spinner" />
              <span class="loading__text">{{ t("loading") }}</span>
            </div>

            <div
              v-if="
                cellCount > 1 && isVisible(i - 1) && seriesIdx[i - 1] < 0 && !cellLoading[i - 1]
              "
              class="cell__empty"
            >
              <span class="cell__empty-chip">{{ t("pickSeries") }}</span>
            </div>
          </div>
        </div>

        <div v-if="sliceCount[activeCell] > 1" class="slicebar">
          <button
            class="slicebar__play"
            :class="{ 'is-playing': cinePlaying[activeCell] }"
            :title="cinePlaying[activeCell] ? t('pause') : t('playLoop')"
            @click="toggleCine"
          >
            <svg v-if="!cinePlaying[activeCell]" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
            </svg>
          </button>
          <select
            class="slicebar__speed"
            :title="t('cineSpeed')"
            :value="cineFps"
            @change="setSpeed(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="f in CINE_SPEEDS" :key="f" :value="f">{{ f }} fps</option>
          </select>
          <input
            class="slicebar__range"
            type="range"
            min="0"
            :max="sliceCount[activeCell] - 1"
            :value="sliceIndex[activeCell]"
            @input="onSlider"
          />
          <span class="slicebar__count"
            >{{ sliceIndex[activeCell] + 1 }} / {{ sliceCount[activeCell] }}</span
          >
        </div>
      </div>
    </div>

    <MetaPanel :open="metaPanelOpen" :groups="metaGroups" @close="metaPanelOpen = false" />

    <div v-if="confirmClearOpen" class="modal" @click.self="confirmClearOpen = false">
      <div class="modal__card">
        <p class="modal__msg">{{ t("confirmClear") }}</p>
        <div class="modal__actions">
          <button class="modal__btn" @click="confirmClearOpen = false">{{ t("cancel") }}</button>
          <button class="modal__btn modal__btn--danger" @click="doClearAnnotations">
            {{ t("clear") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import Toolbar from "./Toolbar.vue";
import SeriesRail from "./SeriesRail.vue";
import Controls from "./Controls.vue";
import Overlay from "./Overlay.vue";
import MetaPanel from "./MetaPanel.vue";
import {
  initCornerstone,
  setPrimaryTool,
  TOOLS,
  createStack,
  readImageMetadata,
  readMetadataGroups,
} from "@orbidicom/core";
import type {
  StackHandle,
  WindowLevel,
  DataSource,
  SeriesSummary,
  ImageMetadata,
  MetaGroup,
} from "@orbidicom/core";
import { t } from "../i18n";

// Selectable viewport layouts (cell count -> CSS class on the grid). MAX_CELLS
// is the largest layout; every per-cell array is sized to it and the extra
// cells are simply display:none (so their stacks stay attached to live DOM).
const MAX_CELLS = 10;
const VALID_LAYOUTS = new Set([1, 2, 4, 6, 8, 10]);
const CINE_FPS = 10; // default playback speed
const CINE_SPEEDS = [5, 10, 15, 20, 30]; // fps options in the bottom cine bar
const LOAD_TIMEOUT_MS = 45_000;

const props = defineProps<{ source: DataSource; studyUids?: string[]; title?: string }>();
const series = ref<SeriesSummary[]>([]);
const cellCount = ref(1);
const activeCell = ref(0);
const activeTool = ref<string>(TOOLS.WindowLevel);
const cineFps = ref(CINE_FPS);
const confirmClearOpen = ref(false);
// Overlay cycle: full info -> patient data blurred (demos) -> hidden.
const overlayMode = ref<"full" | "private" | "off">("full");
const OVERLAY_CYCLE = { full: "private", private: "off", off: "full" } as const;
const overlayOn = computed(() => overlayMode.value !== "off");
const overlayPrivacy = computed(() => overlayMode.value === "private");
const cycleOverlay = () => (overlayMode.value = OVERLAY_CYCLE[overlayMode.value]);

// Mobile controls menu (header hamburger → Controls dropdown).
const menuOpen = ref(false);

// Metadata reader panel (full DICOM tag dump for the active cell's image).
const metaPanelOpen = ref(false);
const metaGroups = ref<MetaGroup[]>([]);
async function openMeta() {
  const i = activeCell.value;
  const id = cellImageIds[i][sliceIndex[i]];
  metaGroups.value = id ? await readMetadataGroups(id) : [];
  metaPanelOpen.value = true;
}

// Per-cell reactive state (index 0..MAX_CELLS-1).
const fill = <T,>(v: T) => Array.from({ length: MAX_CELLS }, () => v);
const seriesIdx = reactive<number[]>(fill(-1));
const sliceIndex = reactive<number[]>(fill(0));
const sliceCount = reactive<number[]>(fill(0));
const wl = reactive<(WindowLevel | null)[]>(fill<WindowLevel | null>(null));
// Normalized DICOM metadata for each cell's current slice, driving the overlay.
const meta = reactive<(ImageMetadata | null)[]>(fill<ImageMetadata | null>(null));
const cellLoading = reactive<boolean[]>(fill(false));
const cinePlaying = reactive<boolean[]>(fill(false));
// Background warm-up (stackPrefetch) progress per cell, driving the top loader bar.
const prefetchLoaded = reactive<number[]>(fill(0));
const prefetchTotal = reactive<number[]>(fill(0));

// Per-cell non-reactive handles.
const els: (HTMLDivElement | null)[] = fill(null);
const stacks: (StackHandle | null)[] = fill(null);
const cellImageIds: string[][] = Array.from({ length: MAX_CELLS }, () => []);
const tokens = fill(0);

// Which cells are on screen: in single view only the focused cell shows (so it
// fills the stage); otherwise the first `cellCount` cells. Cells beyond that are
// display:none and excluded from the CSS grid's auto-flow.
const isVisible = (i: number) =>
  cellCount.value === 1 ? i === activeCell.value : i < cellCount.value;
const gridClass = computed(() => `grid--n${cellCount.value}`);

// Refresh the overlay metadata for a cell from its current slice's imageId.
// Best-effort + race-guarded: a late resolve is dropped if the slice moved on.
async function refreshMeta(i: number) {
  const id = cellImageIds[i][sliceIndex[i]];
  if (!id) {
    meta[i] = null;
    return;
  }
  try {
    const m = await readImageMetadata(id);
    if (cellImageIds[i][sliceIndex[i]] === id) meta[i] = m;
  } catch {
    /* metadata is best-effort — never block rendering on it */
  }
}

const setEl = (i: number, el: unknown) => (els[i] = (el as HTMLDivElement) ?? null);

const activeModality = computed(() => series.value[seriesIdx[activeCell.value]]?.modality ?? "");
const canCine = computed(() => sliceCount[activeCell.value] > 1);
const canDownload = computed(
  () => !!props.source.capabilities.downloadArchive && !!props.source.downloadArchive,
);
// Top loader bar follows the active cell: visible only while its multi-frame
// series is still warming (some frames not yet cached).
const caching = computed(() => {
  const i = activeCell.value;
  return prefetchTotal[i] > 1 && prefetchLoaded[i] < prefetchTotal[i];
});
const cachePct = computed(() => {
  const i = activeCell.value;
  return prefetchTotal[i] > 0 ? Math.round((prefetchLoaded[i] / prefetchTotal[i]) * 100) : 0;
});
const cellLabel = (i: number) => {
  const s = series.value[seriesIdx[i]];
  return s ? s.seriesDescription || s.modality || "" : "";
};
const onActive = (fn: (s: StackHandle) => void) => {
  const s = stacks[activeCell.value];
  if (s) fn(s);
};

function ensureStack(i: number): StackHandle {
  if (!stacks[i]) {
    stacks[i] = createStack(els[i]!, {
      onSlice: ({ index, count }) => {
        sliceIndex[i] = index;
        sliceCount[i] = count;
        void refreshMeta(i);
      },
      onVoi: (v) => (wl[i] = v),
      onReady: () => (cellLoading[i] = false),
      onPrefetch: ({ loaded, total }) => {
        prefetchLoaded[i] = loaded;
        prefetchTotal[i] = total;
      },
    });
  }
  return stacks[i]!;
}

async function loadIntoCell(i: number, si: number) {
  const token = ++tokens[i];
  const s = series.value[si];
  if (!s) return;
  seriesIdx[i] = si;
  stopCine(i);
  cellLoading[i] = true;
  // Watchdog: never leave the spinner up forever on a stuck/huge series.
  const watchdog = window.setTimeout(() => {
    if (tokens[i] === token) cellLoading[i] = false;
  }, LOAD_TIMEOUT_MS);

  let imageIds: string[];
  try {
    imageIds = await props.source.getImageIds(s);
  } catch {
    if (tokens[i] === token) cellLoading[i] = false;
    clearTimeout(watchdog);
    return;
  }
  if (token !== tokens[i]) {
    clearTimeout(watchdog);
    return;
  }
  cellImageIds[i] = imageIds;
  sliceCount[i] = imageIds.length;
  sliceIndex[i] = 0;

  try {
    // A non-image series (e.g. encapsulated PDF / structured report) returns no
    // imageIds; the cell simply stays empty. PDF rendering is a later plan.
    if (imageIds.length) {
      await ensureStack(i).setStack(imageIds);
      void refreshMeta(i);
    }
  } finally {
    clearTimeout(watchdog);
    if (token === tokens[i]) cellLoading[i] = false;
  }
}

const selectSeries = (si: number) => loadIntoCell(activeCell.value, si);

function onSlider(e: Event) {
  const target = Number((e.target as HTMLInputElement).value);
  stacks[activeCell.value]?.setIndex(target);
}

function toggleCine() {
  const i = activeCell.value;
  if (!stacks[i] || !canCine.value) return;
  if (cinePlaying[i]) {
    stacks[i]!.stopCine();
    cinePlaying[i] = false;
  } else {
    stacks[i]!.playCine(cineFps.value);
    cinePlaying[i] = true;
  }
}
// Change cine speed; if the active cell is playing, restart it at the new fps.
function setSpeed(fps: number) {
  cineFps.value = fps;
  const i = activeCell.value;
  if (cinePlaying[i] && stacks[i]) {
    stacks[i]!.stopCine();
    stacks[i]!.playCine(fps);
  }
}
function stopCine(i: number) {
  if (cinePlaying[i]) {
    stacks[i]?.stopCine();
    cinePlaying[i] = false;
  }
}

function setLayout(n: number) {
  if (!VALID_LAYOUTS.has(n)) return;
  cellCount.value = n;
  // Keep the focused cell within the visible range when shrinking the grid.
  if (n > 1 && activeCell.value >= n) activeCell.value = 0;
  // Stop cine on any cell that just became hidden.
  for (let i = 0; i < MAX_CELLS; i++) if (!isVisible(i)) stopCine(i);
}

const applyPreset = (p: { windowWidth: number; windowCenter: number }) =>
  onActive((s) => s.setWindowLevel(p.windowWidth, p.windowCenter));
const selectTool = (name: string) => {
  setPrimaryTool(name);
  activeTool.value = name;
};
// removeAllAnnotations() (inside the handle) is global, so refresh every live
// cell's overlay — not just the active one — to wipe their SVG too.
function doClearAnnotations() {
  confirmClearOpen.value = false;
  for (const s of stacks) s?.clearAnnotations();
}

function activeStudyUid(): string {
  return series.value[seriesIdx[activeCell.value]]?.studyInstanceUID ?? props.studyUids?.[0] ?? "";
}
function onDownloadStudy() {
  void Promise.resolve(props.source.downloadArchive?.(activeStudyUid())).catch((e) =>
    console.warn("[viewer] study archive download failed", e),
  );
}

function onKeydown(e: KeyboardEvent) {
  const s = stacks[activeCell.value];
  if (!s) return;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    s.scroll(1);
    e.preventDefault();
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    s.scroll(-1);
    e.preventDefault();
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  await initCornerstone();
  series.value = await props.source.getSeries(props.studyUids ?? []);
  if (series.value.length) await loadIntoCell(0, 0);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  for (let i = 0; i < MAX_CELLS; i++) {
    tokens[i]++;
    stopCine(i);
    stacks[i]?.destroy();
    stacks[i] = null;
  }
});
</script>
<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bg);
  /* Full-viewport shell: clip any internal overflow here so it can't propagate
     up to the document and turn into a page scroll. Inner regions (rail, panels)
     keep their own scrolling. */
  overflow: hidden;
}
.content {
  display: flex;
  flex: 1;
  min-height: 0;
}
/* Left panel: the series rail scrolls, the controls dock pins to its bottom. */
.sidebar {
  display: flex;
  flex-direction: column;
  flex: none;
  min-height: 0;
  border-right: 1px solid var(--border);
}
.sidebar :deep(.rail) {
  flex: 1;
  min-height: 0;
  border-right: 0;
}
.stage {
  position: relative;
  flex: 1;
  min-width: 0;
  /* Critical in the mobile column layout: without this the stage refuses to
     shrink below its content (image + cine bar) and the page scrolls. */
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #000;
}

.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  gap: 2px;
  background: var(--border);
}
/* Layouts: 1×1, 1×2, 2×2, 2×3, 2×4, 2×5. Hidden cells (display:none) are
   skipped by grid auto-flow, so the visible cells fill the template exactly. */
.grid--n2 {
  grid-template-columns: 1fr 1fr;
}
.grid--n4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid--n6 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid--n8 {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid--n10 {
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.cell {
  position: relative;
  background: #000;
  overflow: hidden;
  min-height: 0;
}
.cell--hidden {
  display: none;
}
.cell--active {
  outline: 2px solid var(--highlight);
  outline-offset: -2px;
}
.cs-viewport {
  position: absolute;
  inset: 0;
}
.cell__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  pointer-events: none;
}
.cell__empty-chip {
  max-width: 220px;
  text-align: center;
  line-height: 1.5;
  color: var(--muted);
  font-size: 13px;
  font-family: var(--font);
  padding: 11px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.02);
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(5, 8, 8, 0.55);
}
.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--accent-strong);
  animation: spin 1.1s linear infinite;
}
.loading__text {
  font-size: 12px;
  color: var(--muted);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Non-blocking warm-up bar: floats over the top of the stage (absolute) so it
   never pushes the viewport down when it shows/hides. Transparent gradient
   backdrop keeps the label legible over dark pixels without occluding them. */
.toploader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
}
.toploader__track {
  height: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.toploader__fill {
  height: 100%;
  background: var(--accent-strong);
  transition: width 0.2s ease;
}
.toploader__meta {
  display: flex;
  align-items: baseline;
  gap: 4px 10px;
  padding: 5px 14px 8px;
  font-family: var(--font);
  font-size: 12px;
  line-height: 1.3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95);
}
.toploader__label {
  flex: none;
  font-family: var(--mono);
  font-weight: 600;
  color: var(--accent-strong);
}
.toploader__note {
  color: var(--text);
  opacity: 0.82;
  min-width: 0;
}
.toploader-enter-active,
.toploader-leave-active {
  transition: opacity 0.25s ease;
}
.toploader-enter-from,
.toploader-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .toploader__fill,
  .toploader-enter-active,
  .toploader-leave-active {
    transition: none;
  }
}

.slicebar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--panel);
  border-top: 1px solid var(--border);
}
.slicebar__play {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--elevated);
  color: var(--text);
  cursor: pointer;
  transition:
    color 0.12s,
    border-color 0.12s;
}
.slicebar__play:hover {
  border-color: var(--accent-strong);
}
.slicebar__play.is-playing {
  color: var(--highlight);
  border-color: var(--highlight);
}
.slicebar__play svg {
  width: 16px;
  height: 16px;
}
.slicebar__speed {
  flex: none;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--r-sm);
  background: var(--elevated);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.slicebar__count {
  flex: none;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  min-width: 54px;
  text-align: right;
}
.slicebar__range {
  flex: 1;
  appearance: none;
  height: 4px;
  border-radius: 3px;
  background: var(--border);
  outline: none;
}
.slicebar__range::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--accent-strong);
  cursor: pointer;
  border: 2px solid var(--panel);
}
.slicebar__range::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border: 2px solid var(--panel);
  border-radius: 50%;
  background: var(--accent-strong);
  cursor: pointer;
}

/* In-app confirm dialog. */
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}
.modal__card {
  width: 100%;
  max-width: 340px;
  padding: 20px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}
.modal__msg {
  margin: 0 0 18px;
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.45;
}
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal__btn {
  font: inherit;
  font-size: 13px;
  padding: 8px 15px;
  cursor: pointer;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--elevated);
  color: var(--text);
}
.modal__btn:hover {
  border-color: var(--accent-strong);
}
.modal__btn--danger {
  background: var(--highlight);
  border-color: var(--highlight);
  color: #fff;
}
.modal__btn--danger:hover {
  background: var(--highlight-strong);
  border-color: var(--highlight-strong);
}

@media (max-width: 640px) {
  .content {
    flex-direction: column;
  }
  /* Rail becomes a top strip; its dock collapses to a floating hamburger. */
  .sidebar {
    width: 100%;
    border-right: 0;
  }
  .sidebar :deep(.rail) {
    flex: none;
  }
  .toploader__meta {
    flex-wrap: wrap;
    padding: 5px 12px;
    gap: 2px 8px;
    font-size: 11px;
  }
  .toploader__note {
    flex-basis: 100%;
  }
  /* Dense grids would be unusably small on a phone: cap columns at 2 and let
     rows flow, so 6/8/10-up become scrollable 2-wide stacks. */
  .grid--n6,
  .grid--n8,
  .grid--n10 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(40vw, 1fr);
    gap: 3px;
    overflow-y: auto;
  }
  .grid--n2,
  .grid--n4 {
    gap: 3px;
  }
  .cell__empty {
    padding: 14px;
  }
  .cell__empty-chip {
    font-size: 12px;
    padding: 9px 13px;
    max-width: 180px;
  }
}
</style>
