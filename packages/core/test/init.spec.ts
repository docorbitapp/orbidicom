import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted above const declarations, so shared spies must
// live in vi.hoisted() to exist by the time the factories run.
const h = vi.hoisted(() => {
  const tg = {
    addTool: vi.fn(),
    setToolActive: vi.fn(),
    setToolPassive: vi.fn(),
  };
  return {
    coreInit: vi.fn().mockResolvedValue(undefined),
    toolsInit: vi.fn().mockResolvedValue(undefined),
    addTool: vi.fn(),
    setMax: vi.fn(),
    tg,
    createToolGroup: vi.fn(() => tg),
    getToolGroup: vi.fn(() => tg),
  };
});

vi.mock("@cornerstonejs/core", () => ({
  init: h.coreInit,
  imageLoadPoolManager: { setMaxSimultaneousRequests: h.setMax },
  Enums: { RequestType: { Interaction: "interaction", Prefetch: "prefetch" } },
}));
vi.mock("@cornerstonejs/dicom-image-loader", () => ({ init: vi.fn() }));
vi.mock("@cornerstonejs/tools", () => {
  const T = (toolName: string) => Object.assign(class {}, { toolName });
  return {
    init: h.toolsInit,
    addTool: h.addTool,
    ToolGroupManager: { createToolGroup: h.createToolGroup, getToolGroup: h.getToolGroup },
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
  };
});

import { initCornerstone, setPrimaryTool, TOOLS, TOOL_GROUP_ID } from "../src/cornerstone/init";

describe("initCornerstone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the orbidicom tool group id (no docorbit branding)", () => {
    expect(TOOL_GROUP_ID).toBe("orbidicom");
  });

  it("initializes core + tools once and is idempotent", async () => {
    await initCornerstone();
    await initCornerstone();
    expect(h.coreInit).toHaveBeenCalledTimes(1);
    expect(h.toolsInit).toHaveBeenCalledTimes(1);
  });

  it("setPrimaryTool clears all bindings then re-activates pan + zoom + the chosen tool", () => {
    setPrimaryTool(TOOLS.Zoom);
    expect(h.tg.setToolPassive).toHaveBeenCalledWith(expect.any(String), {
      removeAllBindings: true,
    });
    const activated = h.tg.setToolActive.mock.calls.map((c) => c[0]);
    expect(activated).toContain(TOOLS.Pan);
    expect(activated).toContain(TOOLS.Zoom);
  });
});
