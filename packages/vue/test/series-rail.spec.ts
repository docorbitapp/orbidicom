import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
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
});
