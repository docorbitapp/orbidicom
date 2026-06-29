import { describe, it, expect } from "vitest";
import { alignLabelmapsToStack } from "../src/seg/align";
import type { SegLabelmap } from "../src/seg/parse";

const lm = (sop: string, data: number[]): SegLabelmap => ({
  sourceSopInstanceUid: sop,
  rows: 1,
  columns: data.length,
  data: Uint8Array.from(data),
});

describe("alignLabelmapsToStack", () => {
  it("pairs each labelmap with the stack image whose SOP UID matches, in stack order", () => {
    const stack = [
      { imageId: "img:a", sopInstanceUID: "A" },
      { imageId: "img:b", sopInstanceUID: "B" },
      { imageId: "img:c", sopInstanceUID: "C" },
    ];
    const labelmaps = [lm("C", [0, 3]), lm("A", [1, 2])]; // out of order, B unsegmented

    const aligned = alignLabelmapsToStack(stack, labelmaps);

    expect(aligned.map((a) => a.imageId)).toEqual(["img:a", "img:c"]); // stack order, only matched
    expect(Array.from(aligned[0].raster)).toEqual([1, 2]);
    expect(Array.from(aligned[1].raster)).toEqual([0, 3]);
  });

  it("ignores labelmaps with no matching stack image", () => {
    const stack = [{ imageId: "img:a", sopInstanceUID: "A" }];
    expect(alignLabelmapsToStack(stack, [lm("Z", [1])])).toEqual([]);
  });

  it("returns the distinct segment indices present across the aligned rasters", () => {
    const stack = [
      { imageId: "img:a", sopInstanceUID: "A" },
      { imageId: "img:b", sopInstanceUID: "B" },
    ];
    const aligned = alignLabelmapsToStack(stack, [lm("A", [0, 1, 2]), lm("B", [0, 2, 4])]);
    expect(segmentIndicesIn(aligned)).toEqual([1, 2, 4]);
  });
});

// Re-export check kept inline so the helper's companion stays covered.
import { segmentIndicesIn } from "../src/seg/align";
