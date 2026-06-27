<template>
  <div ref="rootEl" class="lang">
    <button
      ref="buttonEl"
      type="button"
      class="lang__button"
      :title="t('language')"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <!-- Standard globe: outline + equator + meridian ellipse. -->
      <svg
        class="lang__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
      </svg>
      <span class="lang__current">{{ currentLabel }}</span>
      <svg
        class="lang__chev"
        :class="{ 'lang__chev--open': open }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Flips to whichever side has more room: upward in the bottom dock,
         downward when the trigger sits near the top (e.g. mobile). -->
    <div v-if="open" class="lang__pop" :class="dropUp ? 'lang__pop--up' : 'lang__pop--down'">
      <input
        ref="searchEl"
        v-model="query"
        class="lang__search"
        type="text"
        :placeholder="t('langSearch')"
        role="combobox"
        aria-controls="lang-listbox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-activedescendant="filtered[active] ? `lang-opt-${filtered[active].code}` : undefined"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="choose(filtered[active])"
        @keydown.esc.prevent="close(true)"
        @keydown.tab="close()"
      />
      <ul id="lang-listbox" class="lang__list" role="listbox">
        <li
          v-for="(it, i) in filtered"
          :id="`lang-opt-${it.code}`"
          :key="it.code"
          class="lang__opt"
          :class="{
            'lang__opt--active': i === active,
            'lang__opt--current': it.code === getLang(),
          }"
          role="option"
          :aria-selected="it.code === getLang()"
          @click="choose(it)"
          @mousemove="active = i"
        >
          <span class="lang__opt-label">{{ it.name }}</span>
          <!-- The language's own endonym, so a misclick into an unfamiliar UI
               language is still recoverable. Hidden when it equals the label. -->
          <span v-if="it.showNative" class="lang__opt-native">{{ it.native }}</span>
        </li>
        <li v-if="filtered.length === 0" class="lang__empty">{{ t("langNoMatch") }}</li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { t, setLang, getLang, LOCALES, localeName } from "../i18n";

interface LangItem {
  code: string;
  /** Name in the active UI language (e.g. "Korece" when Turkish is active). */
  name: string;
  /** The language's own endonym (e.g. "한국어"). */
  native: string;
  showNative: boolean;
}

const rootEl = ref<HTMLElement | null>(null);
const buttonEl = ref<HTMLButtonElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);
const open = ref(false);
const query = ref("");
const active = ref(0);
// Open upward by default (bottom-dock placement); placeMenu() flips it down when
// the trigger is near the top of the viewport and the popover wouldn't fit above.
const dropUp = ref(true);

// Each locale labeled in the active UI language; recomputes when the language
// changes (localeName reads the active language reactively).
const items = computed<LangItem[]>(() =>
  LOCALES.map((l) => {
    const name = localeName(l.code);
    return { code: l.code, name, native: l.label, showNative: l.label !== name };
  }),
);

const currentLabel = computed(() => localeName(getLang()));

// Diacritic-insensitive so "francais" finds "Français"; matches the localized
// name, the endonym, and the code.
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const filtered = computed<LangItem[]>(() => {
  const q = fold(query.value.trim());
  if (!q) return items.value;
  return items.value.filter(
    (it) => fold(it.name).includes(q) || fold(it.native).includes(q) || it.code.includes(q),
  );
});

// Keep the highlight in range as the filtered set shrinks/grows.
watch(filtered, (list) => {
  if (active.value > list.length - 1) active.value = Math.max(0, list.length - 1);
});

function toggle() {
  if (open.value) close();
  else openMenu();
}

// Choose the side with more room, so the list is never clipped by the viewport
// edge (the bug on mobile, where the switcher rides near the top).
function placeMenu() {
  const btn = buttonEl.value;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  dropUp.value = spaceAbove > spaceBelow;
}

function openMenu() {
  placeMenu();
  open.value = true;
  query.value = "";
  active.value = Math.max(
    0,
    filtered.value.findIndex((l) => l.code === getLang()),
  );
  void nextTick(() => searchEl.value?.focus());
}

// `refocus` returns focus to the trigger (keyboard dismissal via Esc); a Tab or
// an outside click intentionally lets focus flow on naturally.
function close(refocus = false) {
  open.value = false;
  if (refocus) void nextTick(() => buttonEl.value?.focus());
}

function move(delta: number) {
  const n = filtered.value.length;
  if (n === 0) return;
  active.value = (active.value + delta + n) % n;
  scrollActiveIntoView();
}

// Keep the highlighted option visible in the scrolling list during keyboard nav.
function scrollActiveIntoView() {
  const code = filtered.value[active.value]?.code;
  if (!code) return;
  void nextTick(() =>
    rootEl.value?.querySelector(`#lang-opt-${code}`)?.scrollIntoView({ block: "nearest" }),
  );
}

function choose(it: LangItem | undefined) {
  if (!it) return;
  setLang(it.code);
  close(true);
}

function onPointerDown(e: PointerEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onPointerDown));
</script>
<style scoped>
.lang {
  position: relative;
  display: inline-flex;
  width: 100%;
  color: var(--muted);
}
/* Trigger mirrors the old native select: globe leading, chevron trailing. */
.lang__button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--r-sm);
  background: var(--elevated);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.12s,
    color 0.12s;
}
.lang__button:hover {
  border-color: color-mix(in srgb, var(--accent-strong) 45%, var(--border));
}
.lang__button:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
  border-color: var(--accent-strong);
}
.lang__icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  color: var(--muted);
}
.lang__current {
  flex: 1 1 auto;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lang__chev {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  opacity: 0.7;
  transition: transform 0.15s;
}
.lang__chev--open {
  transform: rotate(180deg);
}

/* Popover floats off the trigger; the up/down modifier picks the side. */
.lang__pop {
  position: absolute;
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  min-width: 100%;
  width: max-content;
  max-width: 260px;
  padding: 6px;
  border-radius: var(--r-sm);
  background: var(--elevated);
  border: 1px solid var(--border);
  box-shadow: 0 8px 28px rgb(0 0 0 / 0.32);
}
.lang__pop--up {
  bottom: calc(100% + 6px);
}
.lang__pop--down {
  top: calc(100% + 6px);
}
.lang__search {
  /* border-box so width:100% + padding + border fills the popover exactly,
     lining the field up with the option rows below (no overhang). */
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 9px;
  margin-bottom: 6px;
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
}
/* iOS Safari auto-zooms the page when a focused input's text is < 16px. On
   touch devices bump the field to 16px to suppress that zoom-on-focus; desktop
   keeps the compact 13px. */
@media (pointer: coarse) {
  .lang__search {
    font-size: 16px;
  }
}
.lang__search:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
  border-color: var(--accent-strong);
}
.lang__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
}
.lang__opt {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 9px;
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}
.lang__opt--active {
  background: color-mix(in srgb, var(--accent-strong) 22%, transparent);
}
.lang__opt--current {
  color: var(--accent-strong);
  font-weight: 600;
}
.lang__opt-native {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--muted);
}
.lang__empty {
  padding: 10px 9px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
