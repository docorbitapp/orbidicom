<template>
  <div class="srview">
    <p v-if="error" class="srview__err">{{ t("srError") }}</p>
    <template v-else>
      <h2 v-if="tree.title" class="srview__title">{{ tree.title }}</h2>
      <ul class="srview__tree">
        <SrNodeView v-for="(child, i) in tree.root.children" :key="i" :node="child" />
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
// Renders a normalized DICOM Structured Report (SrTree) as a readable, indented
// tree. The root node is the document container (its concept name is the title),
// so we render its children. Source-agnostic: the data sources hand us the same
// SrTree shape whether parsed from DICOM-JSON (DICOMweb) or dicom-parser (local).
import type { SrTree } from "@orbidicom/core";
import SrNodeView from "./SrNodeView.vue";
import { t } from "../i18n";

defineProps<{ tree: SrTree; error?: boolean }>();
</script>

<style scoped>
.srview {
  position: absolute;
  inset: 0;
  overflow: auto;
  background: var(--panel);
  color: var(--text);
  font-family: var(--font);
  font-size: 13px;
  line-height: 1.5;
  padding: 18px 20px;
}
.srview__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}
.srview__tree {
  list-style: none;
  margin: 0;
  padding: 0;
}
.srview__err {
  color: var(--muted);
  margin-top: 40px;
  text-align: center;
}
</style>
