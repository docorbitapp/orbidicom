<template>
  <div class="dock">
    <div class="dock__panel" :class="{ 'dock__panel--open': open }">
      <!-- Host actions (e.g. a "New study" button) injected by the app. -->
      <slot />
      <LangSwitcher />
      <span class="dock__hint">{{ t("hint") }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import LangSwitcher from "./LangSwitcher.vue";
import { t } from "../i18n";

// `open` is parent-controlled: it only matters on phones, where the panel is a
// dropdown toggled by the header hamburger. On desktop the panel is always shown
// as a cluster pinned to the bottom of the left rail.
defineProps<{ open?: boolean }>();
</script>
<style scoped>
.dock {
  flex: none;
}
/* Desktop: a cluster pinned to the bottom of the left rail. */
.dock__panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--border);
  background: var(--panel);
}
.dock__hint {
  font-family: var(--font);
  font-size: 11px;
  line-height: 1.35;
  color: var(--hush);
}

@media (max-width: 640px) {
  /* Phones: a dropdown anchored under the header hamburger, toggled by `open`. */
  .dock__panel {
    position: fixed;
    left: calc(10px + env(safe-area-inset-left, 0px));
    top: calc(56px + env(safe-area-inset-top, 0px));
    z-index: 70;
    display: none;
    min-width: 200px;
    max-width: calc(100vw - 20px);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
  }
  .dock__panel--open {
    display: flex;
  }
}
</style>
