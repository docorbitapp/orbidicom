export interface SeriesSummary {
  seriesInstanceUID: string;
  studyInstanceUID?: string;
  modality?: string;
  seriesDescription?: string;
  numberOfFrames?: number;
}

export interface InstanceMetadata {
  imageId: string;
  [tag: string]: unknown;
}

import type { SrTree } from "./sr/types";
export type { SrTree, SrNode, SrCode, SrRef, SrValueType } from "./sr/types";

export interface DataSourceCapabilities {
  downloadArchive?: boolean;
  /** @deprecated mirror of `reports.pdf` — kept for back-compat. */
  encapsulatedPdf?: boolean;
  /** Which report documents this source can surface/render. */
  reports?: { pdf?: boolean; sr?: boolean };
  multiStudy?: boolean;
}

/** An encapsulated-PDF instance found in a series (rendered, not stacked). */
export interface PdfInstance {
  sopUid: string;
  /** WADO-RS BulkDataURI for the EncapsulatedDocument, if the server advertised one. */
  bulkDataUri: string | null;
}

/** A renderable report document in a series (encapsulated PDF or Structured Report). */
export interface ReportInstance {
  sopUid: string;
  kind: "pdf" | "sr";
  instanceNumber?: number;
  description?: string;
  modality?: string;
  /** WADO-RS BulkDataURI for a PDF's EncapsulatedDocument, if advertised. */
  bulkDataUri?: string | null;
}

export interface DataSource {
  capabilities: DataSourceCapabilities;
  getSeries(studyUids: string[]): Promise<SeriesSummary[]>;
  getImageIds(series: SeriesSummary): Promise<string[]>;
  getMetadata?(imageId: string): Promise<InstanceMetadata>;
  downloadArchive?(studyUid: string): Promise<Blob | void>;
  /** @deprecated use {@link listReports} — kept so existing callers compile. */
  listPdfs?(series: SeriesSummary): PdfInstance[];
  /** Fetch an encapsulated PDF's bytes and return an object URL (application/pdf). */
  getPdfObjectUrl?(series: SeriesSummary, pdf: PdfInstance): Promise<string>;
  /** Report documents (PDF + SR) discovered in a series during {@link getImageIds}. */
  listReports?(series: SeriesSummary): ReportInstance[];
  /** Parse a Structured Report instance into a normalized {@link SrTree}. */
  getStructuredReport?(series: SeriesSummary, report: ReportInstance): Promise<SrTree>;
}
