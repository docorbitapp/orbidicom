import { describe, it, expect } from "vitest";
import {
  isSegmentation,
  parseSeg,
  mapFramesToSegments,
  cielabToRgb,
  unpackBinarySegmentationFrames,
  buildSegLabelmaps,
  SEG_SOP_CLASS_UID,
} from "../src/seg/parse";

const V = (s: string | number) => ({ Value: [s] });
const SEQ = (...items: Record<string, unknown>[]) => ({ Value: items });
const code = (meaning: string) => SEQ({ "00080104": V(meaning) });

const SEG_META: Record<string, unknown> = {
  "00080016": V(SEG_SOP_CLASS_UID), // SOP Class UID = Segmentation Storage
  "00620001": V("BINARY"), // Segmentation Type
  "00280010": V(2), // Rows
  "00280011": V(2), // Columns
  "00280008": V(2), // Number of Frames
  "00081115": SEQ({ "0020000E": V("REF-SERIES") }), // Referenced Series Sequence
  "00620002": SEQ(
    {
      "00620004": V(1), // Segment Number
      "00620005": V("Tumor"), // Segment Label
      "00620008": V("SEMIAUTOMATIC"), // Algorithm Type
      "00620003": code("Anatomical Structure"), // Category
      "0062000F": code("Neoplasm"), // Property Type
      "0062000D": { Value: [34896, 53475, 50166] }, // Recommended Display CIELab (~red)
    },
    {
      "00620004": V(2),
      "00620005": V("Edema"),
      "0062000D": { Value: [65535, 32768, 32768] }, // ~white
    },
  ),
  "52009230": SEQ(
    {
      "0062000A": SEQ({ "0062000B": V(1) }), // Segment Identification → segment 1
      "00089124": SEQ({ "00082112": SEQ({ "00081155": V("src-A") }) }), // source image
    },
    {
      "0062000A": SEQ({ "0062000B": V(2) }),
      "00089124": SEQ({ "00082112": SEQ({ "00081155": V("src-B") }) }),
    },
  ),
};

describe("DICOM-SEG parsing", () => {
  it("detects a Segmentation SOP class", () => {
    expect(isSegmentation(SEG_META)).toBe(true);
    expect(isSegmentation({ "00080016": V("1.2.840.10008.5.1.4.1.1.2") })).toBe(false);
  });

  it("parses segment definitions: labels, codes, dims, referenced series, and colors", () => {
    const info = parseSeg(SEG_META);
    expect(info).toMatchObject({
      segmentationType: "BINARY",
      rows: 2,
      columns: 2,
      numberOfFrames: 2,
      referencedSeriesUid: "REF-SERIES",
    });
    expect(info.segments).toHaveLength(2);
    expect(info.segments[0]).toMatchObject({
      number: 1,
      label: "Tumor",
      algorithmType: "SEMIAUTOMATIC",
      category: "Anatomical Structure",
      type: "Neoplasm",
    });
    const [r, g, b] = info.segments[0].color!;
    expect(r).toBeGreaterThan(230);
    expect(g).toBeLessThan(70);
    expect(b).toBeLessThan(70);
    expect(info.segments[1].color!.every((c) => c > 250)).toBe(true);
  });

  it("maps each frame to its segment number and source image instance", () => {
    expect(mapFramesToSegments(SEG_META)).toEqual([
      { segmentNumber: 1, sourceSopInstanceUid: "src-A" },
      { segmentNumber: 2, sourceSopInstanceUid: "src-B" },
    ]);
  });

  it("converts DICOM CIELab (US-scaled) to sRGB at the black/white anchors", () => {
    expect(cielabToRgb([0, 32768, 32768]).every((c) => c < 6)).toBe(true);
    expect(cielabToRgb([65535, 32768, 32768]).every((c) => c > 250)).toBe(true);
  });

  it("unpacks a BINARY segmentation bitstream into per-frame masks (LSB-first, frame-continuous)", () => {
    // frame0 = [1,0,1,0], frame1 = [1,1,0,0] packed LSB-first → 0b00110101 = 0x35
    const masks = unpackBinarySegmentationFrames(new Uint8Array([0x35]), 2, 2, 2);
    expect(Array.from(masks[0])).toEqual([1, 0, 1, 0]);
    expect(Array.from(masks[1])).toEqual([1, 1, 0, 0]);
  });

  it("assembles per-frame masks into one labelmap per source image, merging segments", () => {
    const masks = [new Uint8Array([1, 0, 1, 0]), new Uint8Array([0, 1, 0, 1])];
    const frameMap = [
      { segmentNumber: 1, sourceSopInstanceUid: "src-A" },
      { segmentNumber: 2, sourceSopInstanceUid: "src-A" },
    ];
    const maps = buildSegLabelmaps({ rows: 2, columns: 2 }, masks, frameMap);
    expect(maps).toHaveLength(1);
    expect(maps[0].sourceSopInstanceUid).toBe("src-A");
    expect(Array.from(maps[0].data)).toEqual([1, 2, 1, 2]); // segment number per pixel, 0 = background
  });

  it("produces a separate labelmap per source image and skips frames with no source", () => {
    const masks = [new Uint8Array([1, 1]), new Uint8Array([1, 0]), new Uint8Array([1, 1])];
    const frameMap = [
      { segmentNumber: 1, sourceSopInstanceUid: "src-A" },
      { segmentNumber: 1, sourceSopInstanceUid: "src-B" },
      { segmentNumber: 2 }, // no source image → cannot be placed
    ];
    const maps = buildSegLabelmaps({ rows: 1, columns: 2 }, masks, frameMap);
    expect(maps.map((m) => m.sourceSopInstanceUid).sort()).toEqual(["src-A", "src-B"]);
  });
});
