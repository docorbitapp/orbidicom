import { describe, it, expect } from "vitest";
import { srTreeFromParser } from "../src/sr/from-parser";

// Minimal stand-in for a dicom-parser DataSet: string(tag) for scalars, and
// elements[tag].items[].dataSet for sequences (nested DataSets).
type FakeDs = {
  string: (tag: string) => string | undefined;
  elements?: Record<string, { items?: { dataSet: FakeDs }[] }>;
};
const ds = (strings: Record<string, string>, seqs: Record<string, FakeDs[]> = {}): FakeDs => ({
  string: (tag) => strings[tag],
  elements: Object.fromEntries(
    Object.entries(seqs).map(([tag, list]) => [tag, { items: list.map((d) => ({ dataSet: d })) }]),
  ),
});
const code = (value: string, scheme: string, meaning: string): FakeDs =>
  ds({ x00080100: value, x00080102: scheme, x00080104: meaning });

describe("srTreeFromParser", () => {
  it("parses a CONTAINER with TEXT, NUM (+units), and CODE children from a dicom-parser DataSet", () => {
    const root = ds(
      { x0040a040: "CONTAINER" },
      {
        x0040a043: [code("111060", "DCM", "Report")],
        x0040a730: [
          ds(
            { x0040a010: "CONTAINS", x0040a040: "TEXT", x0040a160: "No acute abnormality." },
            { x0040a043: [code("121071", "DCM", "Finding")] },
          ),
          ds(
            { x0040a010: "CONTAINS", x0040a040: "NUM" },
            {
              x0040a043: [code("G-D705", "SRT", "Volume")],
              x0040a300: [ds({ x0040a30a: "12.5" }, { x004008ea: [code("ml", "UCUM", "ml")] })],
            },
          ),
          ds(
            { x0040a010: "CONTAINS", x0040a040: "CODE" },
            {
              x0040a043: [code("121070", "DCM", "Findings")],
              x0040a168: [code("R-00339", "SRT", "Normal")],
            },
          ),
        ],
      },
    );

    const tree = srTreeFromParser(root as never);
    expect(tree.title).toBe("Report");
    expect(tree.root.valueType).toBe("CONTAINER");
    expect(tree.root.children).toHaveLength(3);

    const [text, num, codeNode] = tree.root.children;
    expect(text).toMatchObject({
      valueType: "TEXT",
      relationship: "CONTAINS",
      conceptName: { meaning: "Finding" },
      text: "No acute abnormality.",
    });
    expect(num).toMatchObject({ valueType: "NUM", num: { value: 12.5, unit: { meaning: "ml" } } });
    expect(codeNode).toMatchObject({
      valueType: "CODE",
      code: { value: "R-00339", meaning: "Normal" },
    });
  });
});
