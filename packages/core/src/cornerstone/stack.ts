import { RenderingEngine, Enums, eventTarget, cache } from "@cornerstonejs/core";
import { ToolGroupManager, utilities as csToolsUtils, annotation } from "@cornerstonejs/tools";
import { TOOL_GROUP_ID } from "./init";

let seq = 0;

export interface SliceInfo {
  index: number;
  count: number;
}
export interface WindowLevel {
  ww: number;
  wc: number;
}
export interface PrefetchProgress {
  /** Frames decoded into cache so far. */
  loaded: number;
  /** Total frames in the current stack. */
  total: number;
}
export interface StackCallbacks {
  onSlice?: (s: SliceInfo) => void;
  onVoi?: (wl: WindowLevel) => void;
  onReady?: () => void;
  /** Background warm-up progress as stackPrefetch decodes the series. */
  onPrefetch?: (p: PrefetchProgress) => void;
}

export interface StackHandle {
  setStack: (imageIds: string[]) => Promise<void>;
  setWindowLevel: (ww: number, wc: number) => void;
  scroll: (delta: number) => void;
  setIndex: (index: number) => void;
  playCine: (fps: number) => void;
  stopCine: () => void;
  invert: () => void;
  rotate: () => void;
  flipH: () => void;
  reset: () => void;
  clearAnnotations: () => void;
  destroy: () => void;
}

function voiToWl(voi: { lower: number; upper: number } | undefined): WindowLevel | null {
  if (!voi) return null;
  return { ww: Math.round(voi.upper - voi.lower), wc: Math.round((voi.upper + voi.lower) / 2) };
}

export function createStack(element: HTMLDivElement, cb: StackCallbacks = {}): StackHandle {
  const n = seq++;
  const engineId = `orbidicom-engine-${n}`;
  const viewportId = `stack-${n}`;
  const engine = new RenderingEngine(engineId);
  engine.enableElement({ viewportId, type: Enums.ViewportType.STACK, element });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vp = engine.getViewport(viewportId) as any;
  ToolGroupManager.getToolGroup(TOOL_GROUP_ID)?.addViewport(viewportId, engineId);

  let count = 0;
  let cineOn = false;
  let destroyed = false;
  // Track view transforms locally — reading them back from the viewport is
  // unreliable, which made rotate not advance and flip not toggle.
  let rotation = 0;
  let flippedH = false;

  // Re-fit on layout/orientation change (was rendering stretched on mobile).
  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    try {
      engine.resize(true, false);
    } catch {
      /* mid-teardown */
    }
  });
  ro.observe(element);

  const emitSlice = () => cb.onSlice?.({ index: vp.getCurrentImageIdIndex?.() ?? 0, count });
  const emitVoi = () => {
    const wl = voiToWl(vp.getProperties?.()?.voiRange);
    if (wl) cb.onVoi?.(wl);
  };

  // The listener is element-scoped, so every slice change for THIS viewport
  // fires it. (The old detail.element guard never matched -> counter stuck at 1.)
  const onStackNewImage = (e: Event) => {
    const idx = (e as CustomEvent).detail?.imageIdIndex;
    cb.onSlice?.({
      index: typeof idx === "number" ? idx : (vp.getCurrentImageIdIndex?.() ?? 0),
      count,
    });
  };
  const onVoiModified = (e: Event) => {
    if ((e as CustomEvent).detail?.viewportId === viewportId) emitVoi();
  };
  let readyFired = false;
  const onRendered = (e: Event) => {
    if (!readyFired && (e as CustomEvent).detail?.viewportId === viewportId) {
      readyFired = true;
      cb.onReady?.();
    }
  };

  // Background warm-up progress. stackPrefetch decodes the whole series into the
  // shared cache; we count how many of THIS stack's frames have landed so the UI
  // can show a non-blocking "caching" bar while the user already scrolls.
  let stackIds = new Set<string>();
  const loadedIds = new Set<string>();
  const emitPrefetch = () => cb.onPrefetch?.({ loaded: loadedIds.size, total: stackIds.size });
  // The cache event is global (all viewports share one cache), so filter to the
  // ids that belong to this stack before counting.
  const onCacheAdded = (e: Event) => {
    const id = (e as CustomEvent).detail?.image?.imageId as string | undefined;
    if (id && stackIds.has(id) && !loadedIds.has(id)) {
      loadedIds.add(id);
      emitPrefetch();
    }
  };

  element.addEventListener(Enums.Events.STACK_NEW_IMAGE, onStackNewImage as EventListener);
  eventTarget.addEventListener(Enums.Events.VOI_MODIFIED, onVoiModified as EventListener);
  element.addEventListener(Enums.Events.IMAGE_RENDERED, onRendered as EventListener);
  eventTarget.addEventListener(Enums.Events.IMAGE_CACHE_IMAGE_ADDED, onCacheAdded as EventListener);

  return {
    async setStack(imageIds: string[]) {
      if (destroyed || imageIds.length === 0) return;
      count = imageIds.length;
      readyFired = false;
      rotation = 0;
      flippedH = false;
      // Reset warm-up tracking for the new series. Pre-seed with frames already
      // in cache (e.g. revisiting a series) so progress reflects reality and the
      // bar doesn't get stuck below 100% when no new cache events will fire.
      stackIds = new Set(imageIds);
      loadedIds.clear();
      for (const id of imageIds) {
        try {
          if (cache.isLoaded(id)) loadedIds.add(id);
        } catch {
          /* isLoaded is best-effort */
        }
      }
      emitPrefetch();
      await vp.setStack(imageIds, 0);
      vp.render();
      emitSlice();
      emitVoi();
      // Warm the ENTIRE series in the background so the first scroll/cine pass
      // doesn't pay a network round-trip + decode per slice. stackPrefetch queues
      // every slice into the low-priority Prefetch pool — nearest-to-current first.
      // The active slice (Interaction priority) always preempts the warm-up.
      try {
        csToolsUtils.stackPrefetch.enable(element);
      } catch {
        /* prefetch is an optimization; never let it break loading */
      }
    },
    setWindowLevel(ww: number, wc: number) {
      if (destroyed) return;
      vp.setProperties({ voiRange: { lower: wc - ww / 2, upper: wc + ww / 2 } });
      vp.render();
    },
    scroll(delta: number) {
      if (destroyed) return;
      vp.scroll(delta);
    },
    setIndex(index: number) {
      if (destroyed) return;
      vp.setImageIdIndex(Math.max(0, Math.min(count - 1, index)));
    },
    playCine(fps: number) {
      if (destroyed || cineOn) return;
      cineOn = true;
      csToolsUtils.cine.playClip(element, { framesPerSecond: fps, loop: true });
    },
    stopCine() {
      if (destroyed || !cineOn) return;
      cineOn = false;
      csToolsUtils.cine.stopClip(element);
    },
    invert() {
      if (destroyed) return;
      vp.setProperties({ invert: !vp.getProperties().invert });
      vp.render();
    },
    rotate() {
      if (destroyed) return;
      rotation = (rotation + 90) % 360;
      vp.setViewPresentation({ rotation });
      vp.render();
    },
    flipH() {
      if (destroyed) return;
      // flip() mirrors the camera on every call (a real toggle). setViewPresentation
      // ({flipHorizontal}) can't undo a flip, so we track + call flip() each time.
      flippedH = !flippedH;
      vp.flip({ flipHorizontal: true });
    },
    reset() {
      if (destroyed) return;
      rotation = 0;
      flippedH = false;
      vp.resetProperties();
      vp.resetCamera(); // restores flip (flipHorizontal:false) + initial viewUp
      vp.setViewPresentation({ rotation: 0 });
      vp.render();
      emitVoi();
    },
    clearAnnotations() {
      if (destroyed) return;
      annotation.state.removeAllAnnotations();
      // removeAllAnnotations() only clears state — the drawn measurements stay on
      // the SVG overlay until an annotation render is triggered for this element.
      csToolsUtils.triggerAnnotationRenderForViewportIds([viewportId]);
      vp.render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      ro.disconnect();
      try {
        csToolsUtils.stackPrefetch.disable(element);
      } catch {
        /* ignore — element may already be torn down */
      }
      if (cineOn) {
        try {
          csToolsUtils.cine.stopClip(element);
        } catch {
          /* ignore */
        }
      }
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, onStackNewImage as EventListener);
      eventTarget.removeEventListener(Enums.Events.VOI_MODIFIED, onVoiModified as EventListener);
      element.removeEventListener(Enums.Events.IMAGE_RENDERED, onRendered as EventListener);
      eventTarget.removeEventListener(
        Enums.Events.IMAGE_CACHE_IMAGE_ADDED,
        onCacheAdded as EventListener,
      );
      engine.destroy();
    },
  };
}
