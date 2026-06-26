import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Toolbar from "../src/components/Toolbar.vue";

describe("Toolbar", () => {
  it("shows W/L presets for CT and emits the chosen preset object", async () => {
    const w = mount(Toolbar, {
      props: { modality: "CT", activeTool: "WindowLevel", layout: 1 },
    });
    const opts = w.findAll(".wl__select option");
    expect(opts.length).toBeGreaterThan(1); // "Preset…" + CT windows
    await w.find(".wl__select").setValue("Lung");
    const preset = w.emitted("preset")?.[0]?.[0] as { windowWidth: number; windowCenter: number };
    expect(preset).toMatchObject({ windowWidth: 1500, windowCenter: -600 });
  });

  it("hides the W/L control for non-CT modalities", () => {
    const w = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1 },
    });
    expect(w.find(".wl__select").exists()).toBe(false);
  });

  it("renders the download button only when canDownload is true", () => {
    const without = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1 },
    });
    expect(without.find(".tbtn--download").exists()).toBe(false);
    const withDl = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1, canDownload: true },
    });
    expect(withDl.find(".tbtn--download").exists()).toBe(true);
  });

  it("renders the download-image button only when canDownloadImage is true, and emits", async () => {
    const without = mount(Toolbar, {
      props: { modality: "CT", activeTool: "WindowLevel", layout: 1 },
    });
    expect(without.find(".tbtn--download-image").exists()).toBe(false);

    const w = mount(Toolbar, {
      props: { modality: "CT", activeTool: "WindowLevel", layout: 1, canDownloadImage: true },
    });
    const btn = w.find(".tbtn--download-image");
    expect(btn.exists()).toBe(true);
    await btn.trigger("click");
    expect(w.emitted("downloadImage")).toBeTruthy();
  });

  it("shows the measurement-export buttons when canExportMeasurements and emits the format", async () => {
    const without = mount(Toolbar, {
      props: { modality: "CT", activeTool: "WindowLevel", layout: 1 },
    });
    expect(without.find(".tbtn--export-measurements").exists()).toBe(false);

    const w = mount(Toolbar, {
      props: { modality: "CT", activeTool: "WindowLevel", layout: 1, canExportMeasurements: true },
    });
    const buttons = w.find(".tbtn--export-measurements").findAll("button");
    expect(buttons).toHaveLength(2);
    await buttons[0].trigger("click");
    await buttons[1].trigger("click");
    expect(w.emitted("exportMeasurements")).toEqual([["json"], ["csv"]]);
  });

  it("emits tool when a tool button is clicked", async () => {
    const w = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1 },
    });
    await w.findAll(".tbtn")[0].trigger("click");
    expect(w.emitted("tool")).toBeTruthy();
  });

  it("emits toggleMenu from the header hamburger", async () => {
    const w = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1, menuOpen: false },
    });
    await w.find(".toolbar__menu").trigger("click");
    expect(w.emitted("toggleMenu")).toBeTruthy();
  });

  it("cycles the overlay/privacy mode from the info button", async () => {
    const w = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1, overlayMode: "full" },
    });
    await w.find(".tbtn--overlay").trigger("click");
    expect(w.emitted("cycleOverlay")).toBeTruthy();
  });

  it("offers grid layouts and emits setLayout with the chosen cell count", async () => {
    const w = mount(Toolbar, {
      props: { modality: "MR", activeTool: "WindowLevel", layout: 1 },
    });
    const opts = w.findAll(".layout__select option").map((o) => o.attributes("value"));
    expect(opts).toEqual(["1", "2", "4", "6", "8", "10"]);
    await w.find(".layout__select").setValue("6");
    expect(w.emitted("setLayout")?.[0]).toEqual([6]);
  });
});
