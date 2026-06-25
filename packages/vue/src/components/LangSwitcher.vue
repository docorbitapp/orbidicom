<template>
  <label class="lang" :title="t('language')">
    <svg
      class="lang__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </svg>
    <select
      class="lang__select"
      :value="getLang()"
      @change="onChange(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.label }}</option>
    </select>
  </label>
</template>
<script setup lang="ts">
import { t, setLang, getLang, LOCALES } from "../i18n";

// Self-contained: drives the global reactive locale, so every component using
// t() (this select's value included) updates the moment the language changes.
const onChange = (code: string) => setLang(code);
</script>
<style scoped>
.lang {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  color: var(--muted);
}
.lang__icon {
  width: 18px;
  height: 18px;
}
.lang__select {
  height: 34px;
  padding: 0 8px;
  border-radius: var(--r-sm);
  background: var(--elevated);
  color: var(--text);
  border: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
</style>
