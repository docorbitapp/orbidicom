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
  it("lists image + SR report series, sorted by SeriesNumber (SR is rendered, not dropped)", async () => {
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: fakeClient as never });
    const series = await ds.getSeries(["study-1"]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["S1", "S2", "SR1"]);
    expect(series[0]).toMatchObject({ modality: "CT", seriesDescription: "Scout" });
  });

  it("still drops non-renderable, non-report modalities (PR/KO/PLAN)", async () => {
    const koClient = {
      searchForSeries: vi.fn(async () => [
        { "0020000E": V("PR1"), "00080060": V("PR"), "00200011": V("1") },
        { "0020000E": V("KO1"), "00080060": V("KO"), "00200011": V("2") },
        { "0020000E": V("CT1"), "00080060": V("CT"), "00200011": V("3"), "00201209": V("5") },
      ]),
      retrieveSeriesMetadata: vi.fn(async () => []),
    };
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: koClient as never });
    const series = await ds.getSeries(["study-1"]);
    expect(series.map((s) => s.seriesInstanceUID)).toEqual(["CT1"]);
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

describe("DicomWebDataSource encapsulated PDFs", () => {
  const pdfClient = {
    searchForSeries: vi.fn(async () => [
      { "0020000E": V("DOC1"), "00080060": V("DOC"), "00200011": V("1"), "0008103E": V("Report") },
    ]),
    retrieveSeriesMetadata: vi.fn(async () => [
      // Encapsulated PDF: PDF SOP class + a BulkDataURI, no Rows → not an image.
      {
        "00080018": V("pdf-sop"),
        "00080016": V("1.2.840.10008.5.1.4.1.1.104.1"),
        "00200013": V("1"),
        "00420011": {
          BulkDataURI:
            "http://orthanc/internal/studies/study-1/series/DOC1/instances/pdf-sop/bulk/00420011",
        },
      },
    ]),
  };

  /** Build a WADO-RS-style multipart/related body wrapping `payload`. */
  function multipart(payload: string): ArrayBuffer {
    const enc = new TextEncoder();
    const head = enc.encode("--b\r\nContent-Type: application/octet-stream\r\n\r\n");
    const body = enc.encode(payload);
    const tail = enc.encode("\r\n--b--\r\n");
    const out = new Uint8Array(head.length + body.length + tail.length);
    out.set(head, 0);
    out.set(body, head.length);
    out.set(tail, head.length + body.length);
    return out.buffer;
  }

  it("lists a DOC (encapsulated-PDF report) series — report modalities are NOT filtered", async () => {
    // Regression guard: a standalone DOC report series (Modality DOC, its own
    // Series UID — the common encapsulated-PDF shape) must appear in the rail.
    // DOC/OT are deliberately absent from NON_RENDERABLE_MODALITIES. If a DOC
    // series is missing from the viewer, the QIDO /series response lacked it, not
    // this code.
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: pdfClient as never });
    const series = await ds.getSeries(["study-1"]);
    expect(series.map((s) => s.seriesInstanceUID)).toContain("DOC1");
    expect(series.find((s) => s.seriesInstanceUID === "DOC1")).toMatchObject({ modality: "DOC" });
  });

  it("excludes PDFs from imageIds and exposes them via listPdfs", async () => {
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: pdfClient as never });
    const series = { seriesInstanceUID: "DOC1", studyInstanceUID: "study-1" };
    const ids = await ds.getImageIds(series);
    expect(ids).toEqual([]);
    expect(ds.listPdfs(series)).toEqual([
      {
        sopUid: "pdf-sop",
        bulkDataUri: expect.stringContaining(
          "/studies/study-1/series/DOC1/instances/pdf-sop/bulk/00420011",
        ),
      },
    ]);
  });

  it("getPdfObjectUrl fetches the bulk payload (rebased onto root), strips the multipart envelope, returns a pdf object URL", async () => {
    const captured: Blob[] = [];
    const origCreate = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = vi.fn((b: Blob) => {
      captured.push(b);
      return "blob:pdf";
    }) as never;
    const fetchFn = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'multipart/related; type="application/octet-stream"' },
      arrayBuffer: async () => multipart("%PDF-1.7 hello"),
    })) as unknown as typeof fetch;
    try {
      const ds = new DicomWebDataSource({
        root: "/pacs/dicom-web",
        client: pdfClient as never,
        fetchFn,
      });
      const series = { seriesInstanceUID: "DOC1", studyInstanceUID: "study-1" };
      const url = await ds.getPdfObjectUrl(series, {
        sopUid: "pdf-sop",
        bulkDataUri: "http://orthanc/x/studies/study-1/series/DOC1/instances/pdf-sop/bulk/00420011",
      });
      expect(url).toBe("blob:pdf");
      expect(fetchFn).toHaveBeenCalledWith(
        "/pacs/dicom-web/studies/study-1/series/DOC1/instances/pdf-sop/bulk/00420011",
        expect.objectContaining({ credentials: expect.any(String) }),
      );
      const bytes = new Uint8Array(await captured[0].arrayBuffer());
      expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.7 hello");
    } finally {
      globalThis.URL.createObjectURL = origCreate;
    }
  });
});

describe("DicomWebDataSource structured reports", () => {
  const seq = (...items: Record<string, unknown>[]) => ({ Value: items });
  const code = (val: string, scheme: string, meaning: string) => ({
    "00080100": V(val),
    "00080102": V(scheme),
    "00080104": V(meaning),
  });
  const srClient = {
    searchForSeries: vi.fn(async () => [
      { "0020000E": V("SR1"), "00080060": V("SR"), "00200011": V("9"), "0008103E": V("Report") },
    ]),
    retrieveSeriesMetadata: vi.fn(async () => [
      {
        "00080018": V("sr-sop"),
        "00080016": V("1.2.840.10008.5.1.4.1.1.88.11"), // Basic Text SR
        "00200013": V("1"),
        "0040A040": V("CONTAINER"),
        "0040A043": seq(code("111060", "DCM", "Report")),
        "0040A730": seq({
          "0040A010": V("CONTAINS"),
          "0040A040": V("TEXT"),
          "0040A043": seq(code("121071", "DCM", "Finding")),
          "0040A160": V("No acute abnormality."),
        }),
      },
    ]),
  };

  it("excludes SR from imageIds, lists it as a report, and parses getStructuredReport", async () => {
    const ds = new DicomWebDataSource({ root: "/pacs/dicom-web", client: srClient as never });
    const series = { seriesInstanceUID: "SR1", studyInstanceUID: "study-1" };
    expect(await ds.getImageIds(series)).toEqual([]); // SR carries no pixel frames
    expect(ds.listReports!(series)).toEqual([
      expect.objectContaining({ sopUid: "sr-sop", kind: "sr" }),
    ]);
    const tree = await ds.getStructuredReport!(series, { sopUid: "sr-sop", kind: "sr" });
    expect(tree.title).toBe("Report");
    expect(tree.root.children[0]).toMatchObject({
      valueType: "TEXT",
      text: "No acute abnormality.",
    });
  });
});
