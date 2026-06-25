import { describe, it, expect, beforeEach } from "vitest";
import { windowPresetsFor, seedDefaultPresets } from "../src/presets";

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

  it("returns no presets for non-CT modalities", () => {
    expect(windowPresetsFor("MR")).toEqual([]);
    expect(windowPresetsFor("")).toEqual([]);
  });
});
