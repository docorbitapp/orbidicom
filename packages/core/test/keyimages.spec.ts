import { describe, it, expect } from "vitest";
import { keyImagesToJson, type KeyImage } from "../src/keyimages";

const ki = (over: Partial<KeyImage> = {}): KeyImage => ({
  imageId: "wadors:1",
  seriesInstanceUID: "S1",
  seriesDescription: "Axial",
  modality: "CT",
  sliceIndex: 0,
  ...over,
});

describe("keyImagesToJson", () => {
  it("wraps key images in a provenance envelope with a pinned timestamp", () => {
    const doc = JSON.parse(
      keyImagesToJson(
        [ki(), ki({ imageId: "wadors:2", sliceIndex: 1 })],
        () => "2026-06-29T00:00:00.000Z",
      ),
    );
    expect(doc).toMatchObject({
      schema: "orbidicom.keyimages/v1",
      exportedAt: "2026-06-29T00:00:00.000Z",
      count: 2,
    });
    expect(doc.keyImages).toHaveLength(2);
    expect(doc.keyImages[0]).toMatchObject({
      imageId: "wadors:1",
      seriesDescription: "Axial",
      modality: "CT",
      sliceIndex: 0,
    });
  });

  it("serializes an empty list as count 0", () => {
    const doc = JSON.parse(keyImagesToJson([], () => "t"));
    expect(doc.count).toBe(0);
    expect(doc.keyImages).toEqual([]);
  });
});
