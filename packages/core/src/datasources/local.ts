import type { DataSource, SeriesSummary, DataSourceCapabilities } from "../datasource";

export interface LocalTags {
  seriesInstanceUID: string;
  seriesNumber: number;
  modality: string;
  seriesDescription: string;
  sopInstanceUID: string;
  instanceNumber: number;
  /** Whether the instance has PixelData (7FE0,0010). Instances without it
   *  (DICOMDIR, presentation states, structured reports, etc.) aren't renderable
   *  and are skipped so they can't form a phantom series that hangs on select.
   *  Optional: when omitted (e.g. an injected parseFile in tests) the instance is
   *  treated as renderable; only an explicit `false` skips it. */
  hasPixelData?: boolean;
}

interface LocalInstance {
  imageId: string;
  instanceNumber: number;
}

// Modalities that carry no displayable pixel data (they reference other series):
// Presentation State, Structured Report, Key Object, RT Plan. Kept out of the
// viewer so selecting one can't hang on a series with nothing to decode. Mirrors
// DicomWebDataSource.
const NON_RENDERABLE_MODALITIES = new Set(["PR", "SR", "KO", "PLAN"]);

export interface LocalOptions {
  /** Register a File with the wadouri loader, returning its imageId. */
  addFile?: (file: File) => string | Promise<string>;
  /** Parse a file to the tags we group/sort by. Default: read bytes + dicom-parser. */
  parseFile?: (file: File) => Promise<LocalTags>;
}

/**
 * A {@link DataSource} for local `.dcm` files with no PACS. Files are registered
 * with Cornerstone's wadouri file manager (each yields a `dicomfile:` imageId)
 * and grouped into series via parsed DICOM tags. All files are treated as one
 * synthetic study ("local"), so {@link getSeries} ignores its `studyUids` arg.
 */
export class LocalDataSource implements DataSource {
  readonly capabilities: DataSourceCapabilities = {
    downloadArchive: false,
    encapsulatedPdf: false,
    multiStudy: false,
  };
  private series = new Map<
    string,
    { summary: SeriesSummary; seriesNumber: number; instances: LocalInstance[] }
  >();
  private addFile: (file: File) => string | Promise<string>;
  private parseFile: (file: File) => Promise<LocalTags>;
  private seenSops = new Set<string>();

  constructor(opts: LocalOptions = {}) {
    this.addFile = opts.addFile ?? defaultAddFile;
    this.parseFile = opts.parseFile ?? defaultParseFile;
  }

  /**
   * Parse + register a batch of dropped/selected files. Call before getSeries.
   *
   * Files that aren't DICOM (fail to parse) are skipped rather than throwing, so
   * a dropped study folder or unzipped archive can contain DICOMDIR, READMEs,
   * thumbnails, etc. Returns the number of DICOM instances actually added.
   */
  async addFiles(files: File[]): Promise<number> {
    let added = 0;
    for (const file of files) {
      let t: LocalTags;
      try {
        t = await this.parseFile(file);
      } catch {
        continue; // not a DICOM file — skip it
      }
      // Skip non-renderable modalities (SR/PR/KO/PLAN) and any instance without
      // PixelData (DICOMDIR / presentation states / reports — often blank
      // modality). Either would hang the viewer on a series with nothing to decode.
      if (NON_RENDERABLE_MODALITIES.has(t.modality?.toUpperCase())) continue;
      if (t.hasPixelData === false) continue;
      // Skip an instance already ingested (e.g. dropping a folder AND its zip, or
      // the same SOP under two subfolders) so slices aren't duplicated.
      if (t.sopInstanceUID && this.seenSops.has(t.sopInstanceUID)) continue;
      const imageId = await this.addFile(file);
      if (t.sopInstanceUID) this.seenSops.add(t.sopInstanceUID);
      let entry = this.series.get(t.seriesInstanceUID);
      if (!entry) {
        entry = {
          summary: {
            seriesInstanceUID: t.seriesInstanceUID,
            studyInstanceUID: "local",
            modality: t.modality,
            seriesDescription: t.seriesDescription,
          },
          seriesNumber: t.seriesNumber,
          instances: [],
        };
        this.series.set(t.seriesInstanceUID, entry);
      }
      entry.instances.push({ imageId, instanceNumber: t.instanceNumber });
      added++;
    }
    return added;
  }

  async getSeries(_studyUids: string[]): Promise<SeriesSummary[]> {
    return [...this.series.values()]
      .sort((a, b) => a.seriesNumber - b.seriesNumber)
      .map((e) => ({ ...e.summary, numberOfFrames: e.instances.length }));
  }

  async getImageIds(series: SeriesSummary): Promise<string[]> {
    const entry = this.series.get(series.seriesInstanceUID);
    if (!entry) return [];
    return entry.instances
      .slice()
      .sort((a, b) => a.instanceNumber - b.instanceNumber)
      .map((i) => i.imageId);
  }
}

// --- default wiring to Cornerstone / dicom-parser ----------------------------
// Lazy dynamic imports so importing LocalDataSource for its types never eagerly
// pulls the loader/parser (and keeps the module ESM-clean — no require()).

let loaderP: Promise<{ wadouri: { fileManager: { add: (f: File) => string } } }> | undefined;
async function defaultAddFile(file: File): Promise<string> {
  loaderP ??= import("@cornerstonejs/dicom-image-loader") as unknown as typeof loaderP;
  const loader = await loaderP!;
  return loader.wadouri.fileManager.add(file);
}

const DICM_MAGIC = [0x44, 0x49, 0x43, 0x4d]; // "DICM" at byte offset 128
// A headerless dataset (no 128-byte preamble — common on CD/DVD exports) is still
// parsed, but only up to this size, so a large non-DICOM payload dropped inside a
// study folder can't OOM the tab during the magic-byte sniff.
const NO_PREAMBLE_MAX_BYTES = 80 * 1024 * 1024;

type ParsedDataSet = {
  string: (tag: string) => string | undefined;
  elements?: Record<string, unknown>;
};
let parserP:
  | Promise<{
      parseDicom: (b: Uint8Array, opts?: { TransferSyntaxUID?: string }) => ParsedDataSet;
    }>
  | undefined;
async function defaultParseFile(file: File): Promise<LocalTags> {
  parserP ??= import("dicom-parser").then((m) => m.default) as unknown as typeof parserP;
  const dicomParser = await parserP!;

  // Cheap magic-byte sniff first (only the first 132 bytes): a Part-10 DICOM file
  // has "DICM" at offset 128. Buffer the whole file only once it's worth it; a
  // headerless dataset has no magic, so parse it too — but only when small enough.
  const head = new Uint8Array(await file.slice(0, 132).arrayBuffer());
  const hasPreamble = head.length >= 132 && DICM_MAGIC.every((b, i) => head[128 + i] === b);
  if (!hasPreamble && file.size > NO_PREAMBLE_MAX_BYTES) throw new Error("not a DICOM file");

  const bytes = new Uint8Array(await file.arrayBuffer());
  let ds: ParsedDataSet;
  try {
    ds = dicomParser.parseDicom(bytes);
  } catch {
    // Headerless / no-preamble datasets — retry as Implicit VR Little Endian.
    ds = dicomParser.parseDicom(bytes, { TransferSyntaxUID: "1.2.840.10008.1.2" });
  }
  return {
    seriesInstanceUID: ds.string("x0020000e") || "local-series",
    seriesNumber: Number(ds.string("x00200011")) || 0,
    modality: ds.string("x00080060") || "",
    seriesDescription: ds.string("x0008103e") || "",
    sopInstanceUID: ds.string("x00080018") || "",
    instanceNumber: Number(ds.string("x00200013")) || 0,
    // PixelData (7FE0,0010) present → a renderable image. Absent → DICOMDIR,
    // presentation state, structured report, etc. — skipped by addFiles.
    hasPixelData: ds.elements?.["x7fe00010"] !== undefined,
  };
}
