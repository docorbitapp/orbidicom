// Runtime configuration read from a classic <script src="config.js"> that runs
// before the app module. In a container the file is regenerated at startup from
// environment variables (see deploy/docker-entrypoint.d), so the same image can
// be pointed at any PACS without a rebuild. In dev a default empty config ships
// in public/config.js.

export interface RuntimeConfig {
  /**
   * DICOMweb (WADO-RS / QIDO-RS) base URL the browser calls. Empty string means
   * local-file-only. With the bundled nginx reverse proxy this is typically
   * "/dicom-web" (same-origin, so no CORS configuration is needed on the PACS).
   */
  pacsUrl?: string;
  /** Optional Study Instance UID to auto-open on load. */
  studyUid?: string;
}

declare global {
  interface Window {
    __ORBIDICOM_CONFIG__?: RuntimeConfig;
  }
}

export function runtimeConfig(): RuntimeConfig {
  return window.__ORBIDICOM_CONFIG__ ?? {};
}
