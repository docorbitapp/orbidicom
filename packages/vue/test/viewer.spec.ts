import { describe, it, expect, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const stack = {
  setStack: vi.fn().mockResolvedValue(undefined),
  setWindowLevel: vi.fn(),
  scroll: vi.fn(),
  setIndex: vi.fn(),
  playCine: vi.fn(),
  stopCine: vi.fn(),
  invert: vi.fn(),
  rotate: vi.fn(),
  flipH: vi.fn(),
  reset: vi.fn(),
  clearAnnotations: vi.fn(),
  destroy: vi.fn(),
};
vi.mock("@orbidicom/core", () => ({
  initCornerstone: vi.fn().mockResolvedValue(undefined),
  setPrimaryTool: vi.fn(),
  createStack: vi.fn(() => stack),
  readImageMetadata: vi.fn(async () => ({ patientName: "TEST^PATIENT", patientId: "ID1" })),
  readMetadataGroups: vi.fn(async () => [
    { id: "patient", rows: [{ label: "Patient Name", value: "TEST PATIENT" }] },
  ]),
  windowPresetsFor: () => [],
  TOOLS: {
    WindowLevel: "WindowLevel",
    Pan: "Pan",
    Zoom: "Zoom",
    Length: "Length",
    Angle: "Angle",
    Rectangle: "Rectangle",
    Ellipse: "Ellipse",
    Probe: "Probe",
  },
}));

import Viewer from "../src/components/Viewer.vue";

const source = {
  capabilities: { downloadArchive: false, encapsulatedPdf: false, multiStudy: false },
  getSeries: vi.fn(async () => [
    {
      seriesInstanceUID: "S1",
      studyInstanceUID: "ST",
      modality: "CT",
      seriesDescription: "Axial",
      numberOfFrames: 2,
    },
  ]),
  getImageIds: vi.fn(async () => ["wadors:1", "wadors:2"]),
};

const pdfSource = {
  capabilities: { downloadArchive: false, encapsulatedPdf: true, multiStudy: false },
  getSeries: vi.fn(async () => [
    {
      seriesInstanceUID: "DOC1",
      studyInstanceUID: "ST",
      modality: "DOC",
      seriesDescription: "Report",
    },
  ]),
  getImageIds: vi.fn(async () => [] as string[]),
  listPdfs: vi.fn(() => [{ sopUid: "pdf1", bulkDataUri: null }]),
  getPdfObjectUrl: vi.fn(async () => "blob:report"),
};

describe("Viewer", () => {
  it("loads series from the data source on mount and renders the rail + first stack", async () => {
    const w = mount(Viewer, { props: { source: source as never, studyUids: ["ST"] } });
    await flushPromises();
    expect(source.getSeries).toHaveBeenCalledWith(["ST"]);
    expect(w.find(".rail__item").text()).toContain("Axial");
    expect(source.getImageIds).toHaveBeenCalled();
    expect(stack.setStack).toHaveBeenCalledWith(["wadors:1", "wadors:2"]);
  });

  it("hides the download button when the source can't archive", async () => {
    const w = mount(Viewer, { props: { source: source as never } });
    await flushPromises();
    expect(w.find(".tbtn--download").exists()).toBe(false);
  });

  it("info button cycles the overlay: full -> blurred -> hidden -> full", async () => {
    const w = mount(Viewer, { props: { source: source as never } });
    await flushPromises();
    const btn = w.find(".tbtn--overlay");

    // full: overlay visible, not blurred.
    expect(w.find(".ovlroot").exists()).toBe(true);
    expect(w.find(".ovl--blur").exists()).toBe(false);

    // -> private: overlay visible, patient block blurred.
    await btn.trigger("click");
    expect(w.find(".ovlroot").exists()).toBe(true);
    expect(w.find(".ovl--blur").exists()).toBe(true);

    // -> off: overlay removed entirely.
    await btn.trigger("click");
    expect(w.find(".ovlroot").exists()).toBe(false);

    // -> back to full.
    await btn.trigger("click");
    expect(w.find(".ovlroot").exists()).toBe(true);
    expect(w.find(".ovl--blur").exists()).toBe(false);
  });

  it("opens the metadata panel from the toolbar button", async () => {
    const w = mount(Viewer, { props: { source: source as never } });
    await flushPromises();
    expect(w.find(".metapanel").exists()).toBe(false);
    await w.find(".tbtn--meta").trigger("click");
    await flushPromises();
    expect(w.find(".metapanel").exists()).toBe(true);
    expect(w.find(".metapanel").text()).toContain("TEST PATIENT");
  });

  it("renders a PdfView (not an image stack) for an encapsulated-PDF series", async () => {
    stack.setStack.mockClear();
    const w = mount(Viewer, {
      props: { source: pdfSource as never, studyUids: ["ST"] },
      global: {
        stubs: { PdfView: { props: ["src"], template: '<div class="pdfstub">{{ src }}</div>' } },
      },
    });
    await flushPromises();
    expect(pdfSource.getPdfObjectUrl).toHaveBeenCalled();
    expect(stack.setStack).not.toHaveBeenCalled();
    expect(w.find(".pdfstub").text()).toBe("blob:report");
  });

  it("shows the number of grid cells chosen in the layout selector", async () => {
    const w = mount(Viewer, { props: { source: source as never } });
    await flushPromises();
    // Single view by default: exactly one visible cell.
    expect(w.findAll(".cell:not(.cell--hidden)").length).toBe(1);
    await w.find(".layout__select").setValue("6");
    await flushPromises();
    expect(w.findAll(".cell:not(.cell--hidden)").length).toBe(6);
  });
});
