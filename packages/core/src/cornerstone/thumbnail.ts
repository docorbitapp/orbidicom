import { createStack, type StackHandle } from "./stack";

/** Renders a single DICOM imageId to a small JPEG, reusing one hidden viewport. */
export interface Thumbnailer {
  /** Render `imageId` to a small JPEG Blob, or null if it cannot be captured. */
  render(imageId: string, opts?: { signal?: AbortSignal }): Promise<Blob | null>;
  destroy(): void;
}

export interface ThumbnailerOptions {
  /** Offscreen element edge in CSS px; bounds the captured JPEG. Default 128. */
  size?: number;
  /** JPEG quality 0..1 — thumbnails tolerate compression. Default 0.7. */
  quality?: number;
}

/**
 * A framework-agnostic thumbnail renderer. It keeps ONE hidden, off-screen
 * Cornerstone stack viewport alive and reuses it for every request, capturing the
 * rendered frame via the same untainted-canvas path the viewer uses for exports.
 * Requests must be serialized by the caller (the ThumbnailProvider does this).
 */
export function createThumbnailer(opts: ThumbnailerOptions = {}): Thumbnailer {
  const size = opts.size ?? 128;
  const quality = opts.quality ?? 0.7;
  let element: HTMLDivElement | null = null;
  let handle: StackHandle | null = null;
  let destroyed = false;

  function ensure(): StackHandle {
    if (handle) return handle;
    const el = document.createElement("div");
    // Off-screen but laid out, so Cornerstone can size its canvas.
    el.style.cssText =
      `position:fixed;left:-10000px;top:0;width:${size}px;height:${size}px;` +
      `pointer-events:none;visibility:hidden;`;
    document.body.appendChild(el);
    element = el;
    handle = createStack(el);
    return handle;
  }

  return {
    async render(imageId, renderOpts = {}) {
      if (destroyed || renderOpts.signal?.aborted) return null;
      const h = ensure();
      // A bad frame can make setStack (decode/network) or capture reject; the
      // contract is "null if it cannot be captured", so swallow and resolve null
      // rather than propagating — consistent with captureSliceJpeg's own null path.
      try {
        await h.setStack([imageId]);
        if (destroyed || renderOpts.signal?.aborted) return null;
        return await h.captureSliceJpeg(quality);
      } catch {
        return null;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      handle?.destroy();
      handle = null;
      if (element?.parentNode) element.parentNode.removeChild(element);
      element = null;
    },
  };
}
