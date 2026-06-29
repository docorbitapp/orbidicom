import { describe, it, expect } from "vitest";
import dicomParser from "dicom-parser";
import { dicomJsonToPart10 } from "../src/dicom-encode";

describe("dicomJsonToPart10", () => {
  it("writes a parseable Part-10 file with preamble, file meta, and dataset", () => {
    const bytes = dicomJsonToPart10({
      "00080016": { vr: "UI", Value: ["1.2.840.10008.5.1.4.1.1.88.33"] },
      "00080018": { vr: "UI", Value: ["1.2.3.4.5"] },
      "00080060": { vr: "CS", Value: ["SR"] },
      "00080023": { vr: "DA", Value: ["20260629"] },
      "0040A730": {
        vr: "SQ",
        Value: [
          {
            "0040A040": { vr: "CS", Value: ["TEXT"] },
            "0040A160": { vr: "UT", Value: ["lesion in left lobe"] },
          },
        ],
      },
    });

    // 128-byte preamble + "DICM" magic.
    expect(bytes.length).toBeGreaterThan(132);
    expect(String.fromCharCode(bytes[128], bytes[129], bytes[130], bytes[131])).toBe("DICM");

    const ds = dicomParser.parseDicom(bytes);
    // File meta (group 0002) is Explicit VR LE.
    expect(ds.string("x00020010")).toBe("1.2.840.10008.1.2.1"); // TransferSyntaxUID
    expect(ds.string("x00020002")).toBe("1.2.840.10008.5.1.4.1.1.88.33"); // MediaStorageSOPClassUID
    expect(ds.string("x00020003")).toBe("1.2.3.4.5"); // MediaStorageSOPInstanceUID
    // Dataset.
    expect(ds.string("x00080016")).toBe("1.2.840.10008.5.1.4.1.1.88.33");
    expect(ds.string("x00080060")).toBe("SR");
    expect(ds.string("x00080023")).toBe("20260629");
    // Nested sequence item.
    const item = ds.elements.x0040a730.items[0].dataSet;
    expect(item.string("x0040a040")).toBe("TEXT");
    expect(item.string("x0040a160")).toBe("lesion in left lobe");
  });

  it("round-trips a numeric-string (DS) value inside a sequence", () => {
    const bytes = dicomJsonToPart10({
      "00080016": { vr: "UI", Value: ["1.2.3"] },
      "00080018": { vr: "UI", Value: ["4.5.6"] },
      "0040A730": {
        vr: "SQ",
        Value: [{ "0040A30A": { vr: "DS", Value: ["42.5"] } }],
      },
    });
    const ds = dicomParser.parseDicom(bytes);
    const item = ds.elements.x0040a730.items[0].dataSet;
    expect(item.string("x0040a30a")).toBe("42.5");
    expect(item.floatString("x0040a30a")).toBeCloseTo(42.5);
  });
});
