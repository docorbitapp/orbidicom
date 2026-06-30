import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

// Mock the core overlay model so the component test is deterministic.
const getAnnotationDeleteTargets = vi.fn();
vi.mock("@orbidicom/core", () => ({
  getAnnotationDeleteTargets: (...args: unknown[]) => getAnnotationDeleteTargets(...args),
}));
// Cornerstone barrels are imported by the component for event wiring; stub them.
vi.mock("@cornerstonejs/core", () => ({
  eventTarget: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
  Enums: { Events: { IMAGE_RENDERED: "ir", STACK_NEW_IMAGE: "sni" } },
}));
vi.mock("@cornerstonejs/tools", () => ({
  Enums: { Events: { ANNOTATION_RENDERED: "ar" } },
}));

import AnnotationOverlay from "../src/components/AnnotationOverlay.vue";

const vp = { id: "stack-0", worldToCanvas: () => [0, 0], getCurrentImageId: () => "img-1" };

beforeEach(() => getAnnotationDeleteTargets.mockReset());

describe("AnnotationOverlay", () => {
  it("renders one delete button per target at its canvas position", () => {
    getAnnotationDeleteTargets.mockReturnValue([
      { uid: "a1", toolName: "Length", canvas: { x: 12, y: 34 } },
      { uid: "a2", toolName: "Angle", canvas: { x: 56, y: 78 } },
    ]);
    const w = mount(AnnotationOverlay, {
      props: { getViewport: () => vp, element: document.createElement("div"), version: 0 },
    });
    const btns = w.findAll(".cs-del-x");
    expect(btns).toHaveLength(2);
    expect(btns[0].attributes("style")).toContain("left: 12px");
    expect(btns[0].attributes("style")).toContain("top: 34px");
  });

  it("emits 'delete' with the uid when a button is clicked", async () => {
    getAnnotationDeleteTargets.mockReturnValue([
      { uid: "a1", toolName: "Length", canvas: { x: 0, y: 0 } },
    ]);
    const w = mount(AnnotationOverlay, {
      props: { getViewport: () => vp, element: document.createElement("div"), version: 0 },
    });
    await w.find(".cs-del-x").trigger("click");
    expect(w.emitted("delete")?.[0]).toEqual(["a1"]);
  });

  it("renders nothing when the viewport is null", () => {
    const w = mount(AnnotationOverlay, {
      props: { getViewport: () => null, element: null, version: 0 },
    });
    expect(w.findAll(".cs-del-x")).toHaveLength(0);
    expect(getAnnotationDeleteTargets).not.toHaveBeenCalled();
  });

  it("recomputes targets when the version prop changes", async () => {
    getAnnotationDeleteTargets.mockReturnValue([]);
    const w = mount(AnnotationOverlay, {
      props: { getViewport: () => vp, element: document.createElement("div"), version: 0 },
    });
    expect(getAnnotationDeleteTargets).toHaveBeenCalledTimes(1); // onMounted
    getAnnotationDeleteTargets.mockReturnValue([
      { uid: "a1", toolName: "Length", canvas: { x: 1, y: 2 } },
    ]);
    await w.setProps({ version: 1 });
    expect(getAnnotationDeleteTargets).toHaveBeenCalledTimes(2);
    expect(w.findAll(".cs-del-x")).toHaveLength(1);
  });
});
