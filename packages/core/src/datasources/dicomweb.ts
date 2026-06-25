import { api } from "dicomweb-client";
import { wadors } from "@cornerstonejs/dicom-image-loader";
import type { DataSource, SeriesSummary, DataSourceCapabilities } from "../datasource";
import type { AuthStrategy } from "../auth";
import { authHeaders } from "../auth";
import { buildWadoRsImageId } from "../imageIds";

const TAG = {
  SERIES_UID: "0020000E",
  SERIES_NUMBER: "00200011",
  SERIES_DESCRIPTION: "0008103E",
  MODALITY: "00080060",
  NUM_SERIES_INSTANCES: "00201209",
  SOP_UID: "00080018",
  SOP_CLASS_UID: "00080016",
  NUMBER_OF_FRAMES: "00280008",
  INSTANCE_NUMBER: "00200013",
  ROWS: "00280010",
  ENCAPSULATED_DOCUMENT: "00420011",
} as const;

// Encapsulated PDF Storage SOP Class UID.
const ENCAPSULATED_PDF_SOP = "1.2.840.10008.5.1.4.1.1.104.1";

// Modalities the viewer cannot display: they carry no pixel data and are not
// encapsulated documents (PR/SR/KO reference other series; PLAN is RT). Keeping
// them out of the rail avoids a silent black cell. PDF reports (DOC/OT) are NOT
// listed — the encapsulated-PDF path handles them.
const NON_RENDERABLE_MODALITIES = new Set(["PR", "SR", "KO", "PLAN"]);

export interface PdfInstance {
  sopUid: string;
  /** WADO-RS BulkDataURI for the EncapsulatedDocument, if the server advertised one. */
  bulkDataUri: string | null;
}

/** The subset of dicomweb-client we use — lets tests inject a fake. */
export interface DICOMwebClientLike {
  searchForSeries(opts: { studyInstanceUID: string }): Promise<Record<string, unknown>[]>;
  retrieveSeriesMetadata(opts: {
    studyInstanceUID: string;
    seriesInstanceUID: string;
  }): Promise<Record<string, unknown>[]>;
}

function first(obj: Record<string, unknown>, tag: string): string {
  const entry = obj?.[tag] as { Value?: unknown[] } | undefined;
  return String(entry?.Value?.[0] ?? "");
}
const num = (obj: Record<string, unknown>, tag: string) => Number(first(obj, tag)) || 0;

export interface DicomWebOptions {
  /** DICOMweb base URL, e.g. "/pacs/dicom-web" or "https://host/dicom-web". */
  root: string;
  auth?: AuthStrategy;
  /** Inject a pre-built client (tests, or a custom transport). */
  client?: DICOMwebClientLike;
}

/**
 * A {@link DataSource} backed by a DICOMweb server (QIDO for the series list,
 * WADO-RS for metadata + frames). PACS-agnostic: the base URL and auth are
 * constructor arguments.
 */
export class DicomWebDataSource implements DataSource {
  readonly capabilities: DataSourceCapabilities = {
    downloadArchive: false,
    encapsulatedPdf: true,
    multiStudy: true,
  };
  private root: string;
  private client: DICOMwebClientLike;
  private pdfsBySeries = new Map<string, PdfInstance[]>();

  constructor(opts: DicomWebOptions) {
    this.root = opts.root.replace(/\/$/, "");
    const auth = opts.auth ?? { kind: "none" };
    this.client =
      opts.client ??
      (new api.DICOMwebClient({
        url: this.root,
        singlepart: false,
        headers: authHeaders(auth),
        withCredentials: auth.kind === "cookie",
        // dicomweb-client types omit some options; cast to pass them through.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any) as unknown as DICOMwebClientLike);
  }

  async getSeries(studyUids: string[]): Promise<SeriesSummary[]> {
    const pairs: { summary: SeriesSummary; number: number }[] = [];
    for (const studyInstanceUID of studyUids) {
      const list = await this.client.searchForSeries({ studyInstanceUID });
      for (const s of list) {
        const modality = first(s, TAG.MODALITY);
        if (NON_RENDERABLE_MODALITIES.has(modality)) continue;
        pairs.push({
          summary: {
            seriesInstanceUID: first(s, TAG.SERIES_UID),
            studyInstanceUID,
            modality,
            seriesDescription: first(s, TAG.SERIES_DESCRIPTION),
            numberOfFrames: num(s, TAG.NUM_SERIES_INSTANCES),
          },
          number: num(s, TAG.SERIES_NUMBER),
        });
      }
    }
    return pairs.sort((a, b) => a.number - b.number).map((p) => p.summary);
  }

  async getImageIds(series: SeriesSummary): Promise<string[]> {
    const studyUid = series.studyInstanceUID;
    if (!studyUid)
      throw new Error("DicomWebDataSource.getImageIds requires series.studyInstanceUID");
    const seriesUid = series.seriesInstanceUID;
    const instances = await this.client.retrieveSeriesMetadata({
      studyInstanceUID: studyUid,
      seriesInstanceUID: seriesUid,
    });
    const ordered = instances
      .slice()
      .sort((a, b) => num(a, TAG.INSTANCE_NUMBER) - num(b, TAG.INSTANCE_NUMBER));

    const imageIds: string[] = [];
    const pdfs: PdfInstance[] = [];
    for (const meta of ordered) {
      const sopUid = first(meta, TAG.SOP_UID);
      if (!sopUid) continue;
      if (first(meta, TAG.SOP_CLASS_UID) === ENCAPSULATED_PDF_SOP) {
        const enc = meta[TAG.ENCAPSULATED_DOCUMENT] as { BulkDataURI?: string } | undefined;
        pdfs.push({ sopUid, bulkDataUri: enc?.BulkDataURI ?? null });
        continue;
      }
      if (meta[TAG.ROWS] === undefined) continue; // non-image (SR etc.) — not renderable
      const frames = num(meta, TAG.NUMBER_OF_FRAMES) || 1;
      // Register once under frame 1; multiframe lookups fall back to this entry.
      wadors.metaDataManager.add(
        buildWadoRsImageId({ root: this.root, studyUid, seriesUid, sopUid, frame: 1 }),
        meta as Parameters<typeof wadors.metaDataManager.add>[1],
      );
      for (let f = 1; f <= frames; f++) {
        imageIds.push(
          buildWadoRsImageId({ root: this.root, studyUid, seriesUid, sopUid, frame: f }),
        );
      }
    }
    this.pdfsBySeries.set(seriesUid, pdfs);
    return imageIds;
  }

  /** Encapsulated PDFs found during the last {@link getImageIds} for this series. */
  listPdfs(series: SeriesSummary): PdfInstance[] {
    return this.pdfsBySeries.get(series.seriesInstanceUID) ?? [];
  }
}
