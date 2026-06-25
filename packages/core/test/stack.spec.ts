import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const vp = {
    setStack: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    getCurrentImageIdIndex: vi.fn(() => 0),
    getProperties: vi.fn(() => ({ voiRange: { lower: 0, upper: 100 }, invert: false })),
    setProperties: vi.fn(),
    scroll: vi.fn(),
    setImageIdIndex: vi.fn(),
    setViewPresentation: vi.fn(),
    flip: vi.fn(),
    resetProperties: vi.fn(),
    resetCamera: vi.fn(),
  };
  const engine = {
    enableElement: vi.fn(),
    getViewport: vi.fn(() => vp),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    vp,
    engine,
    RenderingEngine: vi.fn(() => engine),
    getToolGroup: vi.fn(() => ({ addViewport: vi.fn() })),
    evtAdd: vi.fn(),
    evtRemove: vi.fn(),
  };
});

vi.mock("@cornerstonejs/core", () => ({
  RenderingEngine: h.RenderingEngine,
  Enums: {
    ViewportType: { STACK: "stack" },
    Events: {
      STACK_NEW_IMAGE: "a",
      VOI_MODIFIED: "b",
      IMAGE_RENDERED: "c",
      IMAGE_CACHE_IMAGE_ADDED: "d",
    },
  },
  eventTarget: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
  cache: { isLoaded: vi.fn(() => false) },
}));
// stack.ts imports ./init, which imports the real dicom-image-loader; stub it so
// the loader's internals don't evaluate against the mocked core.
vi.mock("@cornerstonejs/dicom-image-loader", () => ({
  init: vi.fn(),
  wadors: { metaDataManager: { add: vi.fn() } },
}));
vi.mock("@cornerstonejs/tools", () => {
  // init.ts (imported transitively) builds TOOLS/ALL_TOOLS at module load, so the
  // tool classes must exist on the mock even though stack tests don't call init.
  const T = (toolName: string) => Object.assign(class {}, { toolName });
  return {
    init: vi.fn(),
    addTool: vi.fn(),
    Enums: {
      MouseBindings: { Primary: 1, Secondary: 2, Primary_And_Secondary: 3, Wheel: 4, Auxiliary: 5 },
    },
    WindowLevelTool: T("WindowLevel"),
    ZoomTool: T("Zoom"),
    PanTool: T("Pan"),
    StackScrollTool: T("StackScroll"),
    LengthTool: T("Length"),
    AngleTool: T("Angle"),
    EllipticalROITool: T("EllipticalROI"),
    RectangleROITool: T("RectangleROI"),
    ProbeTool: T("Probe"),
    ToolGroupManager: { getToolGroup: h.getToolGroup },
    utilities: {
      stackPrefetch: { enable: vi.fn(), disable: vi.fn() },
      cine: { playClip: vi.fn(), stopClip: vi.fn() },
      triggerAnnotationRenderForViewportIds: vi.fn(),
    },
    annotation: { state: { removeAllAnnotations: vi.fn() } },
  };
});

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

import { createStack } from "../src/cornerstone/stack";

function fakeEl(): HTMLDivElement {
  return {
    addEventListener: h.evtAdd,
    removeEventListener: h.evtRemove,
  } as unknown as HTMLDivElement;
}

describe("createStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables a STACK viewport and exposes the full handle", () => {
    const handle = createStack(fakeEl());
    expect(h.engine.enableElement).toHaveBeenCalledWith(expect.objectContaining({ type: "stack" }));
    for (const m of [
      "setStack",
      "setWindowLevel",
      "scroll",
      "setIndex",
      "playCine",
      "stopCine",
      "invert",
      "rotate",
      "flipH",
      "reset",
      "clearAnnotations",
      "destroy",
    ]) {
      expect(typeof (handle as unknown as Record<string, unknown>)[m]).toBe("function");
    }
  });

  it("setStack loads imageIds and renders; destroy is safe and idempotent", async () => {
    const handle = createStack(fakeEl());
    await handle.setStack(["wadors:x", "wadors:y"]);
    expect(h.vp.setStack).toHaveBeenCalledWith(["wadors:x", "wadors:y"], 0);
    expect(h.vp.render).toHaveBeenCalled();
    handle.destroy();
    handle.destroy();
    expect(h.engine.destroy).toHaveBeenCalledTimes(1);
  });
});
