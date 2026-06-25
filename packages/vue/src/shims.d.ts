// Vite's `?url` import suffix yields the emitted asset's URL as a string.
// Declared here so `vue-tsc --noEmit` accepts the pdf.js worker import in PdfView.
declare module "*?url" {
  const url: string;
  export default url;
}
