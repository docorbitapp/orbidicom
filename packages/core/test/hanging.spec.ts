import { describe, it, expect } from "vitest";
import {
  applyHangingProtocol,
  singleProtocol,
  gridProtocol,
  isImageSeries,
  HANGING_PROTOCOLS,
} from "../src/hanging";
import type { SeriesSummary } from "../src/datasource";

const s = (modality: string, uid = modality): SeriesSummary => ({
  seriesInstanceUID: uid,
  modality,
});
const opts = { maxCells: 10 };

describe("hanging protocols", () => {
  it("isImageSeries flags reports/non-image modalities", () => {
    expect(isImageSeries({ modality: "CT" })).toBe(true);
    expect(isImageSeries({ modality: "DOC" })).toBe(false);
    expect(isImageSeries({ modality: "SR" })).toBe(false);
    expect(isImageSeries({ modality: undefined })).toBe(true); // unknown → treat as image
  });

  it("single → one cell showing the first series (empty study → empty cell)", () => {
    expect(singleProtocol([s("CT"), s("MR")], opts)).toEqual({ cellCount: 1, assignments: [0] });
    expect(singleProtocol([], opts)).toEqual({ cellCount: 1, assignments: [-1] });
  });

  it("grid tiles image series into the smallest fitting layout", () => {
    const r = gridProtocol([s("CT", "a"), s("CT", "b"), s("CT", "c")], opts);
    expect(r.cellCount).toBe(4); // smallest valid layout ≥ 3
    expect(r.assignments).toEqual([0, 1, 2, -1]);
  });

  it("grid skips report series, keeping original series indices", () => {
    const r = gridProtocol([s("DOC", "report"), s("CT", "a"), s("MR", "b")], opts);
    expect(r.cellCount).toBe(2);
    expect(r.assignments).toEqual([1, 2]); // report at index 0 skipped
  });

  it("grid falls back to single view for a report-only study", () => {
    expect(gridProtocol([s("DOC")], opts)).toEqual({ cellCount: 1, assignments: [0] });
  });

  it("grid caps the layout at maxCells", () => {
    const many = Array.from({ length: 12 }, (_, i) => s("CT", `s${i}`));
    expect(gridProtocol(many, { maxCells: 4 }).cellCount).toBe(4);
    expect(gridProtocol(many, { maxCells: 10 }).cellCount).toBe(10);
  });

  it("applyHangingProtocol resolves names, custom functions, and unknown → single", () => {
    expect(applyHangingProtocol([s("CT"), s("MR")], "grid", opts).cellCount).toBe(2);
    expect(applyHangingProtocol([s("CT")], "single", opts).cellCount).toBe(1);
    const custom = () => ({ cellCount: 1, assignments: [0] });
    expect(applyHangingProtocol([s("CT")], custom, opts).assignments).toEqual([0]);
    expect(applyHangingProtocol([s("CT"), s("MR")], "bogus" as never, opts)).toEqual({
      cellCount: 1,
      assignments: [0],
    });
    expect(Object.keys(HANGING_PROTOCOLS)).toEqual(["single", "grid"]);
  });
});
