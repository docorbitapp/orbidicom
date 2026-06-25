<template>
  <Transition name="metapanel">
    <div v-if="open" class="metapanel" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <aside class="metapanel__card">
        <header class="metapanel__head">
          <span class="metapanel__title">{{ t("metadata") }}</span>
          <button class="metapanel__close" :title="t('close')" @click="$emit('close')">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div class="metapanel__body">
          <p v-if="!groups.length" class="metapanel__empty">{{ t("noMetadata") }}</p>
          <section v-for="g in groups" :key="g.id" class="metagroup">
            <h3 class="metagroup__title">{{ groupTitle(g.id) }}</h3>
            <dl class="metagroup__rows">
              <template v-for="r in g.rows" :key="r.label">
                <dt class="metarow__label">{{ r.label }}</dt>
                <dd class="metarow__value">{{ r.value }}</dd>
              </template>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import type { MetaGroup } from "@orbidicom/core";
import { t, type I18nKey } from "../i18n";

defineProps<{ open: boolean; groups: MetaGroup[] }>();
defineEmits<{ close: [] }>();

const GROUP_TITLE: Record<string, I18nKey> = {
  patient: "groupPatient",
  study: "groupStudy",
  series: "groupSeries",
  image: "groupImage",
  equipment: "groupEquipment",
};
const groupTitle = (id: string) => (GROUP_TITLE[id] ? t(GROUP_TITLE[id]!) : id);
</script>
<style scoped>
.metapanel {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.5);
}
.metapanel__card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  height: 100%;
  background: var(--panel);
  border-left: 1px solid var(--border);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.5);
}
.metapanel__head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.metapanel__title {
  font-family: var(--font);
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}
.metapanel__close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.metapanel__close:hover {
  color: var(--text);
  border-color: var(--border);
  background: var(--elevated);
}
.metapanel__close svg {
  width: 18px;
  height: 18px;
}
.metapanel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 14px 20px;
}
.metapanel__empty {
  color: var(--muted);
  font-family: var(--font);
  font-size: 13px;
  padding: 16px 2px;
}
.metagroup {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.metagroup:last-child {
  border-bottom: none;
}
.metagroup__title {
  margin: 0 0 8px;
  font-family: var(--font);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--accent-strong);
}
.metagroup__rows {
  display: grid;
  grid-template-columns: minmax(96px, 38%) 1fr;
  gap: 5px 12px;
  margin: 0;
}
.metarow__label {
  font-family: var(--font);
  font-size: 12px;
  color: var(--muted);
}
.metarow__value {
  margin: 0;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-word;
}
.metapanel-enter-active,
.metapanel-leave-active {
  transition: opacity 0.2s ease;
}
.metapanel-enter-active .metapanel__card,
.metapanel-leave-active .metapanel__card {
  transition: transform 0.22s ease;
}
.metapanel-enter-from,
.metapanel-leave-to {
  opacity: 0;
}
.metapanel-enter-from .metapanel__card,
.metapanel-leave-to .metapanel__card {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .metapanel-enter-active,
  .metapanel-leave-active,
  .metapanel-enter-active .metapanel__card,
  .metapanel-leave-active .metapanel__card {
    transition: none;
  }
}
@media (max-width: 640px) {
  .metapanel__card {
    max-width: none;
  }
}
</style>
