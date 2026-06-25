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
