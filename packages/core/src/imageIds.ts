export function buildWadoRsImageId(p: {
  /** DICOMweb base URL (no trailing slash), e.g. "/pacs/dicom-web" or "https://host/dicom-web". */
  root: string;
  studyUid: string;
  seriesUid: string;
  sopUid: string;
  frame?: number;
}): string {
  const frame = p.frame ?? 1;
  return `wadors:${p.root}/studies/${p.studyUid}/series/${p.seriesUid}/instances/${p.sopUid}/frames/${frame}`;
}
