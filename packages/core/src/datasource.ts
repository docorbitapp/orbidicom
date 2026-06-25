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

export interface DataSourceCapabilities {
  downloadArchive?: boolean;
  encapsulatedPdf?: boolean;
  multiStudy?: boolean;
}

/** An encapsulated-PDF instance found in a series (rendered, not stacked). */
export interface PdfInstance {
  sopUid: string;
  /** WADO-RS BulkDataURI for the EncapsulatedDocument, if the server advertised one. */
  bulkDataUri: string | null;
}

export interface DataSource {
  capabilities: DataSourceCapabilities;
  getSeries(studyUids: string[]): Promise<SeriesSummary[]>;
  getImageIds(series: SeriesSummary): Promise<string[]>;
  getMetadata?(imageId: string): Promise<InstanceMetadata>;
  downloadArchive?(studyUid: string): Promise<Blob | void>;
  /** Encapsulated PDFs discovered in a series during the last {@link getImageIds}. */
  listPdfs?(series: SeriesSummary): PdfInstance[];
  /** Fetch an encapsulated PDF's bytes and return an object URL (application/pdf). */
  getPdfObjectUrl?(series: SeriesSummary, pdf: PdfInstance): Promise<string>;
}
