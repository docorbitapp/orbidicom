import { describe, it, expect, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import SeriesRail from "../src/components/SeriesRail.vue";

const series = [
  { seriesInstanceUID: "S1", modality: "CT", seriesDescription: "Axial", numberOfFrames: 120 },
  { seriesInstanceUID: "S2", modality: "MR", seriesDescription: "", numberOfFrames: 30 },
];

describe("SeriesRail", () => {
  it("renders a row per series with description/modality/count and emits select", async () => {
    const w = mount(SeriesRail, { props: { series, active: 0 } });
    const items = w.findAll(".rail__item");
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain("Axial");
    expect(items[0].text()).toContain("CT");
    expect(items[0].text()).toContain("120");
    await items[1].trigger("click");
    expect(w.emitted("select")?.[0]).toEqual([1]);
  });

  it("falls back to modality when description is blank", () => {
    const w = mount(SeriesRail, { props: { series, active: 0 } });
    expect(w.findAll(".rail__item")[1].text()).toContain("MR");
  });

  it("omits the image count for a no-image report series (e.g. DOC)", () => {
    const reports = [
      {
        seriesInstanceUID: "DOC1",
        modality: "DOC",
        seriesDescription: "REPORT PDF",
        numberOfFrames: 0,
      },
    ];
    const w = mount(SeriesRail, { props: { series: reports, active: 0 } });
    const item = w.findAll(".rail__item")[0];
    expect(item.text()).toContain("DOC");
    expect(item.text()).not.toContain("img"); // no "· 0 img" for report series
  });

  function providerStub(url: string | null) {
    return { get: vi.fn(async () => url), destroy: vi.fn() };
  }

  it("shows the rendered thumbnail once the provider resolves a URL", async () => {
    const provider = providerStub("blob:mock/thumb");
    const w = mount(SeriesRail, { props: { series, active: 0, provider } });
    await flushPromises();
    const img = w.findAll(".rail__item")[0].find(".rail__img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("blob:mock/thumb");
    expect(provider.get).toHaveBeenCalled();
  });

  it("shows the document glyph for a no-image report series and skips the provider", async () => {
    const provider = providerStub("blob:x");
    const reports = [
      {
        seriesInstanceUID: "DOC1",
        modality: "DOC",
        seriesDescription: "REPORT",
        numberOfFrames: 0,
      },
    ];
    const w = mount(SeriesRail, { props: { series: reports, active: 0, provider } });
    await flushPromises();
    expect(w.findAll(".rail__item")[0].find(".rail__glyph--doc").exists()).toBe(true);
    expect(provider.get).not.toHaveBeenCalled();
  });

  it("shows the no-preview glyph when the provider resolves null", async () => {
    const provider = providerStub(null);
    const w = mount(SeriesRail, { props: { series, active: 0, provider } });
    await flushPromises();
    expect(w.findAll(".rail__item")[0].find(".rail__glyph--none").exists()).toBe(true);
  });
});
