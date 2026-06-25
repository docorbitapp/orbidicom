import { describe, it, expect } from "vitest";
import { LocalDataSource, type LocalTags } from "../src/datasources/local";

function file(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name);
}

const tagsByName: Record<string, LocalTags> = {
  "a.dcm": {
    seriesInstanceUID: "S1",
    seriesNumber: 1,
    modality: "CT",
    seriesDescription: "Axial",
    sopInstanceUID: "i2",
    instanceNumber: 2,
  },
  "b.dcm": {
    seriesInstanceUID: "S1",
    seriesNumber: 1,
    modality: "CT",
    seriesDescription: "Axial",
    sopInstanceUID: "i1",
    instanceNumber: 1,
  },
  "c.dcm": {
    seriesInstanceUID: "S2",
    seriesNumber: 2,
    modality: "MR",
    seriesDescription: "T2",
    sopInstanceUID: "j1",
    instanceNumber: 1,
  },
  "report.dcm": {
    seriesInstanceUID: "SR1",
    seriesNumber: 9,
    modality: "SR",
    seriesDescription: "Report",
    sopInstanceUID: "sr1",
    instanceNumber: 1,
  },
  // Parses as DICOM but has no PixelData and blank modality (e.g. DICOMDIR) —
  // must be skipped rather than forming a phantom "Series" that hangs on select.
  DICOMDIR: {
    seriesInstanceUID: "local-series",
    seriesNumber: 0,
    modality: "",
    seriesDescription: "",
    sopInstanceUID: "dd1",
    instanceNumber: 1,
    hasPixelData: false,
  },
};

// A parseFile that throws for non-DICOM files (mirrors dicom-parser rejecting them).
const parseFile = async (f: File): Promise<LocalTags> => {
  const t = tagsByName[f.name];
  if (!t) throw new Error("not a DICOM file");
  return t;
};

describe("LocalDataSource", () => {
  it("groups files into series, orders by InstanceNumber, and returns the added count", async () => {
    let n = 0;
    const ds = new LocalDataSource({ parseFile, addFile: () => `dicomfile:${n++}` });

    const added = await ds.addFiles([file("a.dcm"), file("b.dcm"), file("c.dcm")]);
    expect(added).toBe(3);

    const series = await ds.getSeries([]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["S1", "S2"]);
    expect(series[0]).toMatchObject({
      studyInstanceUID: "local",
      modality: "CT",
      seriesDescription: "Axial",
      numberOfFrames: 2, // per-series image count (S1 has a.dcm + b.dcm)
    });
    expect(series[1].numberOfFrames).toBe(1);

    // a.dcm got id dicomfile:0 (instance 2), b.dcm got dicomfile:1 (instance 1).
    const s1Ids = await ds.getImageIds(series[0]);
    expect(s1Ids).toEqual(["dicomfile:1", "dicomfile:0"]);
    expect(await ds.getImageIds(series[1])).toEqual(["dicomfile:2"]);
  });

  it("drops non-renderable modalities (SR/PR/KO/PLAN)", async () => {
    const ds = new LocalDataSource({ parseFile, addFile: () => "dicomfile:x" });
    const added = await ds.addFiles([file("a.dcm"), file("report.dcm")]);
    expect(added).toBe(1); // SR report skipped
    const series = await ds.getSeries([]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["S1"]);
  });

  it("drops instances with no PixelData (DICOMDIR / blank-modality non-images)", async () => {
    const ds = new LocalDataSource({ parseFile, addFile: () => "dicomfile:x" });
    const added = await ds.addFiles([file("a.dcm"), file("DICOMDIR")]);
    expect(added).toBe(1); // DICOMDIR (hasPixelData:false) skipped — no phantom series
    const series = await ds.getSeries([]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["S1"]);
  });

  it("skips files that aren't DICOM (study folders contain DICOMDIR, READMEs, etc.)", async () => {
    const addFile = (() => {
      let n = 0;
      return () => `dicomfile:${n++}`;
    })();
    const ds = new LocalDataSource({ parseFile, addFile });

    const added = await ds.addFiles([
      file("README.txt"),
      file("a.dcm"),
      file("DICOMDIR"),
      file("b.dcm"),
    ]);
    expect(added).toBe(2); // only the two .dcm parsed
    const series = await ds.getSeries([]);
    expect(series).toHaveLength(1);
    expect(await ds.getImageIds(series[0])).toHaveLength(2);
  });

  it("dedupes repeated SOP instances (folder + its zip, or the same file twice)", async () => {
    let n = 0;
    const ds = new LocalDataSource({ parseFile, addFile: () => `dicomfile:${n++}` });
    const added = await ds.addFiles([file("a.dcm"), file("a.dcm"), file("b.dcm")]);
    expect(added).toBe(2); // second a.dcm (same sopInstanceUID i2) skipped
    const series = await ds.getSeries([]);
    expect(await ds.getImageIds(series[0])).toHaveLength(2);
  });

  it("returns [] for an unknown series and advertises a no-PACS capability set", async () => {
    const ds = new LocalDataSource({ parseFile, addFile: () => "dicomfile:x" });
    expect(await ds.getImageIds({ seriesInstanceUID: "nope" })).toEqual([]);
    expect(ds.capabilities).toMatchObject({ downloadArchive: false, multiStudy: false });
  });
});
