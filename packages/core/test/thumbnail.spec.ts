import { describe, it, expect, vi, beforeEach } from "vitest";

// Reuse-of-createStack is the whole point, so mock it and assert the wiring.
const h = vi.hoisted(() => {
  const handle = {
    setStack: vi.fn().mockResolvedValue(undefined),
    captureSliceJpeg: vi.fn().mockResolvedValue(new Blob(["jpg"], { type: "image/jpeg" })),
    destroy: vi.fn(),
  };
  return { handle, createStack: vi.fn(() => handle) };
});
vi.mock("../src/cornerstone/stack", () => ({ createStack: h.createStack }));

// Minimal DOM: the thumbnailer only needs createElement + body.appendChild and,
// on destroy, parentNode.removeChild. Core tests run in the node env (no document).
vi.stubGlobal("document", {
  createElement: () => ({ style: {}, parentNode: { removeChild: vi.fn() } }),
  body: { appendChild: vi.fn() },
});

import { createThumbnailer } from "../src/cornerstone/thumbnail";

describe("createThumbnailer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a single-image stack and returns the captured JPEG blob", async () => {
    const t = createThumbnailer();
    const blob = await t.render("wadors:mid");
    expect(h.createStack).toHaveBeenCalledTimes(1);
    expect(h.handle.setStack).toHaveBeenCalledWith(["wadors:mid"]);
    expect(h.handle.captureSliceJpeg).toHaveBeenCalled();
    expect(blob).toBeInstanceOf(Blob);
  });

  it("reuses one offscreen viewport across renders", async () => {
    const t = createThumbnailer();
    await t.render("a");
    await t.render("b");
    expect(h.createStack).toHaveBeenCalledTimes(1);
  });

  it("returns null when the capture yields nothing", async () => {
    h.handle.captureSliceJpeg.mockResolvedValueOnce(null);
    const t = createThumbnailer();
    await expect(t.render("x")).resolves.toBeNull();
  });

  it("returns null after destroy and does not render again", async () => {
    const t = createThumbnailer();
    await t.render("a");
    t.destroy();
    await expect(t.render("b")).resolves.toBeNull();
    expect(h.handle.destroy).toHaveBeenCalledTimes(1);
  });

  it("returns null immediately when the signal is already aborted", async () => {
    const t = createThumbnailer();
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(t.render("a", { signal: ctrl.signal })).resolves.toBeNull();
    expect(h.handle.setStack).not.toHaveBeenCalled();
  });
});
