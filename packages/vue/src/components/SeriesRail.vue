<template>
  <div class="rail">
    <button
      v-for="(s, i) in series"
      :key="s.seriesInstanceUID"
      class="rail__item"
      :class="{ 'rail__item--active': i === active }"
      :title="label(s, i)"
      @click="$emit('select', i)"
    >
      <span class="rail__num">{{ i + 1 }}</span>
      <span class="rail__body">
        <span class="rail__name">{{ s.seriesDescription || s.modality || t("series") }}</span>
        <span class="rail__meta">{{ meta(s) }}</span>
      </span>
    </button>
  </div>
</template>
<script setup lang="ts">
import type { SeriesSummary } from "@orbidicom/core";
import { t } from "../i18n";
defineProps<{ series: SeriesSummary[]; active: number }>();
defineEmits<{ select: [number] }>();
// The image count is only meaningful for image series. Report/document series
// (e.g. an encapsulated PDF, modality DOC, 0 frames) show just the modality —
// "DOC · 0 img" reads like an error, so the count is dropped when there are none.
const meta = (s: SeriesSummary) => {
  const mod = s.modality ?? "";
  const n = s.numberOfFrames ?? 0;
  if (n <= 0) return mod;
  return mod ? `${mod} · ${n} img` : `${n} img`;
};
const label = (s: SeriesSummary, i: number) => {
  const m = meta(s);
  return `${i + 1}. ${s.seriesDescription || s.modality || t("series")}${m ? ` (${m})` : ""}`;
};
</script>
<style scoped>
.rail {
  width: 200px;
  flex: none;
  background: var(--panel);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rail__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-left: 3px solid transparent;
  border-radius: var(--r-sm);
  background: var(--panel-2);
  color: var(--text);
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s;
}
.rail__item:hover {
  background: var(--elevated);
}
.rail__item--active {
  background: color-mix(in srgb, var(--accent) 28%, var(--panel-2));
  border-left-color: var(--highlight);
}
.rail__num {
  flex: none;
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg);
  border-radius: 4px;
}
.rail__item--active .rail__num {
  color: var(--highlight);
}
.rail__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}
.rail__name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rail__meta {
  font-size: 11px;
  color: var(--muted);
}

/* Mobile: horizontal strip across the top of the viewport area. */
@media (max-width: 640px) {
  .rail {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    padding: 6px;
  }
  .rail__item {
    width: auto;
    flex: none;
  }
  .rail__name {
    max-width: 120px;
  }
}
</style>
