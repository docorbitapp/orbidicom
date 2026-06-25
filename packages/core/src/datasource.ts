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

export interface DataSource {
  capabilities: DataSourceCapabilities;
  getSeries(studyUids: string[]): Promise<SeriesSummary[]>;
  getImageIds(series: SeriesSummary): Promise<string[]>;
  getMetadata?(imageId: string): Promise<InstanceMetadata>;
  downloadArchive?(studyUid: string): Promise<Blob | void>;
}
