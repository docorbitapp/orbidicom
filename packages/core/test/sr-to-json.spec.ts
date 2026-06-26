import { describe, it, expect } from "vitest";
import { buildMeasurementSr } from "../src/sr/to-json";
import { srTreeFromJson } from "../src/sr/from-json";
import type { Measurement } from "../src/cornerstone/measurements";
import type { SrNode } from "../src/sr/types";

const lengthM: Measurement = {
  annotationUID: "ann-1",
  tool: "Length",
  label: "Tumor long axis",
  imageId: "wadors:/pacs/studies/1/series/2/instances/sop-9/frames/1",
  frameOfReferenceUID: "for-1",
  stats: [{ target: "imageId:x", name: "length", value: 42.5, unit: "mm" }],
  points: [
    [0, 0, 0],
    [42.5, 0, 0],
  ],
};
const roiM: Measurement = {
  annotationUID: "ann-2",
  tool: "RectangleROI",
  label: "Lesion",
  imageId: "wadors:/pacs/studies/1/series/2/instances/sop-9/frames/1",
  frameOfReferenceUID: "for-1",
  stats: [
    { target: "imageId:x", name: "area", value: 100, unit: "mm²" },
    { target: "imageId:x", name: "mean", value: -12.3, unit: "HU" },
  ],
  points: [],
};

const get = (ds: Record<string, unknown>, tag: string) =>
  (ds[tag] as { Value?: unknown[] } | undefined)?.Value?.[0];

function flatten(n: SrNode, out: SrNode[] = []): SrNode[] {
  out.push(n);
  n.children.forEach((c) => flatten(c, out));
  return out;
}

describe("buildMeasurementSr (DICOM-SR generation)", () => {
  it("produces a Comprehensive SR dataset (SR modality, CONTAINER root, given SOP UID)", () => {
    const sr = buildMeasurementSr([lengthM], { sopInstanceUid: "1.2.3" });
    expect(get(sr, "00080016")).toBe("1.2.840.10008.5.1.4.1.1.88.33"); // Comprehensive SR
    expect(get(sr, "00080018")).toBe("1.2.3");
    expect(get(sr, "00080060")).toBe("SR");
    expect(get(sr, "0040A040")).toBe("CONTAINER");
  });

  it("round-trips through srTreeFromJson into a measurement-report tree", () => {
    const sr = buildMeasurementSr([lengthM, roiM], { sopInstanceUid: "1.2.3" });
    const tree = srTreeFromJson(sr);
    expect(tree.title).toBe("Imaging Measurement Report");
    const nums = flatten(tree.root).filter((n) => n.valueType === "NUM");
    expect(nums).toHaveLength(3); // length + area + mean
    const len = nums.find((n) => n.conceptName?.meaning === "Length")!;
    expect(len.num?.value).toBe(42.5);
    expect(len.num?.unit?.meaning).toBe("millimeter");
    const mean = nums.find((n) => n.conceptName?.meaning === "Mean")!;
    expect(mean.num?.value).toBe(-12.3);
    expect(mean.num?.unit?.scheme).toBe("UCUM");
  });

  it("carries each measurement's label as a tracking-identifier text item", () => {
    const sr = buildMeasurementSr([lengthM], { sopInstanceUid: "1.2.3" });
    const texts = flatten(srTreeFromJson(sr).root)
      .filter((n) => n.valueType === "TEXT")
      .map((n) => n.text);
    expect(texts).toContain("Tumor long axis");
  });

  it("defaults a 2.25 (UUID-derived) SOP Instance UID when none is given", () => {
    const uid = get(buildMeasurementSr([lengthM]), "00080018") as string;
    expect(uid).toMatch(/^2\.25\.\d+$/);
  });

  it("emits NUM items only for finite stats, skipping a statless measurement's numbers", () => {
    const statless: Measurement = { ...lengthM, annotationUID: "ann-x", stats: [] };
    const sr = buildMeasurementSr([statless, lengthM], { sopInstanceUid: "1.2.3" });
    const nums = flatten(srTreeFromJson(sr).root).filter((n) => n.valueType === "NUM");
    expect(nums).toHaveLength(1);
  });
});
