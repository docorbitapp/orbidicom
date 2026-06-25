import { describe, it, expect, vi } from "vitest";

const h = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@cornerstonejs/dicom-image-loader", () => ({
  wadors: { metaDataManager: { add: h.add } },
}));

import { DicomWebDataSource } from "../src/datasources/dicomweb";
import { authHeaders } from "../src/auth";

const V = (s: string) => ({ Value: [s] });

const fakeClient = {
  searchForSeries: vi.fn(async () => [
    {
      "0020000E": V("S2"),
      "00080060": V("CT"),
      "00200011": V("2"),
      "0008103E": V("Axial"),
      "00201209": V("100"),
    },
    {
      "0020000E": V("S1"),
      "00080060": V("CT"),
      "00200011": V("1"),
      "0008103E": V("Scout"),
      "00201209": V("3"),
    },
    {
      "0020000E": V("SR1"),
      "00080060": V("SR"),
      "00200011": V("9"),
      "0008103E": V("Report"),
      "00201209": V("1"),
    },
  ]),
  retrieveSeriesMetadata: vi.fn(async () => [
    { "00080018": V("sop-2"), "00200013": V("2"), "00280010": V("512"), "00280008": V("1") },
    { "00080018": V("sop-1"), "00200013": V("1"), "00280010": V("512"), "00280008": V("2") },
  ]),
};

describe("authHeaders", () => {
  it("builds static auth headers and stays empty for none/cookie/token-fn", () => {
    expect(authHeaders({ kind: "bearer", token: "abc" })).toEqual({ Authorization: "Bearer abc" });
    expect(authHeaders({ kind: "basic", username: "u", password: "p" })).toEqual({
      Authorization: "Basic " + btoa("u:p"),
    });
    expect(authHeaders({ kind: "none" })).toEqual({});
    expect(authHeaders({ kind: "cookie" })).toEqual({});
    expect(authHeaders({ kind: "bearer", token: () => "x" })).toEqual({});
  });
});

describe("DicomWebDataSource", () => {
  it("lists renderable series, sorted by SeriesNumber, dropping SR/PR/KO/PLAN", async () => {
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: fakeClient as never });
    const series = await ds.getSeries(["study-1"]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["S1", "S2"]);
    expect(series[0]).toMatchObject({ modality: "CT", seriesDescription: "Scout" });
  });

  it("getImageIds orders by InstanceNumber, expands frames, registers root-aware metadata", async () => {
    h.add.mockClear();
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: fakeClient as never });
    const ids = await ds.getImageIds({ seriesInstanceUID: "S1", studyInstanceUID: "study-1" });
    expect(ids).toEqual([
      "wadors:/pacs/dicom-web/studies/study-1/series/S1/instances/sop-1/frames/1",
      "wadors:/pacs/dicom-web/studies/study-1/series/S1/instances/sop-1/frames/2",
      "wadors:/pacs/dicom-web/studies/study-1/series/S1/instances/sop-2/frames/1",
    ]);
    expect(h.add).toHaveBeenCalledWith(
      "wadors:/pacs/dicom-web/studies/study-1/series/S1/instances/sop-1/frames/1",
      expect.anything(),
    );
  });

  it("strips a trailing slash from root", async () => {
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web/", client: fakeClient as never });
    const ids = await ds.getImageIds({ seriesInstanceUID: "S1", studyInstanceUID: "study-1" });
    expect(ids[0]).toBe(
      "wadors:/pacs/dicom-web/studies/study-1/series/S1/instances/sop-1/frames/1",
    );
  });
});
