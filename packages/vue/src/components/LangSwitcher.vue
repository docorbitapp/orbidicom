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

    <!-- Opens upward: the switcher lives in the bottom dock. -->
    <div v-if="open" class="lang__pop">
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
          v-for="(l, i) in filtered"
          :id="`lang-opt-${l.code}`"
          :key="l.code"
          class="lang__opt"
          :class="{ 'lang__opt--active': i === active, 'lang__opt--current': l.code === getLang() }"
          role="option"
          :aria-selected="l.code === getLang()"
          @click="choose(l)"
          @mousemove="active = i"
        >
          <span class="lang__opt-label">{{ l.label }}</span>
          <span class="lang__opt-code">{{ l.code }}</span>
        </li>
        <li v-if="filtered.length === 0" class="lang__empty">{{ t("langNoMatch") }}</li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { t, setLang, getLang, LOCALES, type Locale } from "../i18n";

const rootEl = ref<HTMLElement | null>(null);
const buttonEl = ref<HTMLButtonElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);
const open = ref(false);
const query = ref("");
const active = ref(0);

const currentLabel = computed(() => LOCALES.find((l) => l.code === getLang())?.label ?? getLang());

// Diacritic-insensitive so "francais" finds "Français"; also matches the code.
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const filtered = computed<Locale[]>(() => {
  const q = fold(query.value.trim());
  if (!q) return LOCALES;
  return LOCALES.filter((l) => fold(l.label).includes(q) || l.code.includes(q));
});

// Keep the highlight in range as the filtered set shrinks/grows.
watch(filtered, (list) => {
  if (active.value > list.length - 1) active.value = Math.max(0, list.length - 1);
});

function toggle() {
  if (open.value) close();
  else openMenu();
}

function openMenu() {
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

function choose(l: Locale | undefined) {
  if (!l) return;
  setLang(l.code);
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

/* Popover floats above the trigger (bottom dock context). */
.lang__pop {
  position: absolute;
  bottom: calc(100% + 6px);
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
.lang__search {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  margin-bottom: 6px;
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
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
.lang__opt-code {
  flex: 0 0 auto;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}
.lang__empty {
  padding: 10px 9px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
