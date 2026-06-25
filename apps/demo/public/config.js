// Runtime configuration for OrbiDICOM (loaded before the app).
//
// This default ships an empty config for local development and static hosting.
// The container image regenerates this file at startup from environment
// variables (ORBIDICOM_PACS_URL, ORBIDICOM_STUDY_UID), so one image works
// against any PACS without rebuilding. Edit freely for static hosting.
window.__ORBIDICOM_CONFIG__ = {
  // DICOMweb base the browser calls. "" = local-file-only.
  // With the bundled nginx reverse proxy, set this to "/dicom-web".
  pacsUrl: "",
  // Optional Study Instance UID to auto-open on load.
  studyUid: "",
};
