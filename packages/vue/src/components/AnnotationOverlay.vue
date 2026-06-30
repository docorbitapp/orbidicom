<template>
  <!-- Absolute layer over the cell's canvas. The layer ignores pointer events so it
       never blocks drawing; only the (hover-revealed) buttons re-enable them. -->
  <div class="cs-annot-overlay">
    <button
      v-for="target in targets"
      :key="target.uid"
      class="cs-del-x"
      type="button"
      :title="t('deleteAnnotation')"
      :aria-label="t('deleteAnnotation')"
      :style="{ left: target.canvas.x + 'px', top: target.canvas.y + 'px' }"
      @pointerdown.stop
      @click.stop="emit('delete', target.uid)"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { eventTarget, Enums as csEnums } from "@cornerstonejs/core";
import { Enums as csToolsEnums } from "@cornerstonejs/tools";
import { getAnnotationDeleteTargets, type DeleteTarget } from "@orbidicom/core";
import { t } from "../i18n";

/** Structural shape of the viewport the overlay needs (satisfied by Cornerstone's IStackViewport). */
interface OverlayViewportLike {
  id: string;
  worldToCanvas(world: [number, number, number]): [number, number];
  getCurrentImageId(): string | undefined;
}

const props = defineProps<{
  /** Lazily resolves this cell's Cornerstone viewport (null until the stack mounts). */
  getViewport: () => OverlayViewportLike | null;
  /** This cell's `.cs-viewport` element — source of element-scoped render events. */
  element: HTMLElement | null;
  /** Bumped by the parent whenever annotation state changes, to force a recompute. */
  version: number;
}>();

const emit = defineEmits<{ (e: "delete", uid: string): void }>();

const targets = ref<DeleteTarget[]>([]);

function recompute() {
  const vp = props.getViewport();
  targets.value = vp ? getAnnotationDeleteTargets(vp) : [];
}

// Initial compute during setup (synchronous) so the first render already carries
// the correct targets. This avoids relying on onMounted's async DOM update.
recompute();

// IMAGE_RENDERED / STACK_NEW_IMAGE are dispatched on the viewport element; recompute
// directly (the element is this cell's, so no id filtering needed there).
const onElementRender = () => recompute();
// ANNOTATION_RENDERED is global on eventTarget; only react to this cell's viewport.
const onAnnotationRender = (e: Event) => {
  const vp = props.getViewport();
  if (!vp) return;
  const id = (e as CustomEvent).detail?.viewportId;
  if (id && id !== vp.id) return;
  recompute();
};

let attachedEl: HTMLElement | null = null;
onMounted(() => {
  attachedEl = props.element;
  attachedEl?.addEventListener(csEnums.Events.IMAGE_RENDERED, onElementRender as EventListener);
  attachedEl?.addEventListener(csEnums.Events.STACK_NEW_IMAGE, onElementRender as EventListener);
  eventTarget.addEventListener(
    csToolsEnums.Events.ANNOTATION_RENDERED,
    onAnnotationRender as EventListener,
  );
});

onUnmounted(() => {
  attachedEl?.removeEventListener(csEnums.Events.IMAGE_RENDERED, onElementRender as EventListener);
  attachedEl?.removeEventListener(csEnums.Events.STACK_NEW_IMAGE, onElementRender as EventListener);
  eventTarget.removeEventListener(
    csToolsEnums.Events.ANNOTATION_RENDERED,
    onAnnotationRender as EventListener,
  );
});

watch(() => props.version, recompute);
</script>

<style scoped>
.cs-annot-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
.cs-del-x {
  position: absolute;
  /* sit just to the right of the annotation's label anchor */
  transform: translate(6px, -50%);
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  /* hidden + inert by default; the parent cell reveals on hover (see Viewer.vue) */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}
.cs-del-x:hover {
  background: #d33;
}
</style>
