import { describe, it, expect, beforeEach } from "vitest";
import { windowPresetsFor, seedDefaultPresets } from "../src/presets";
import { registerWindowPreset } from "../src/registry";

describe("windowPresetsFor", () => {
  beforeEach(() => seedDefaultPresets());

  it("returns the five standard CT windows for CT (case-insensitive)", () => {
    const ct = windowPresetsFor("ct");
    expect(ct.map((p) => p.name)).toEqual(["Soft Tissue", "Bone", "Lung", "Brain", "Abdomen"]);
    expect(ct.find((p) => p.name === "Lung")).toMatchObject({
      windowWidth: 1500,
      windowCenter: -600,
    });
  });

  it("returns no presets for modalities without registered windows", () => {
    expect(windowPresetsFor("MR")).toEqual([]);
    expect(windowPresetsFor("")).toEqual([]);
  });

  it("surfaces host-registered presets for any modality (case-insensitive)", () => {
    // The engine is no longer CT-only: a host can register protocol windows for
    // any modality and they appear for that modality.
    registerWindowPreset({ modality: "XA", name: "Fluoro", windowWidth: 600, windowCenter: 300 });
    const xa = windowPresetsFor("xa");
    expect(xa.map((p) => p.name)).toEqual(["Fluoro"]);
    // Unrelated modalities are unaffected.
    expect(windowPresetsFor("US")).toEqual([]);
  });
});
