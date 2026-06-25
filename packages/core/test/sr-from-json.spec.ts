import { describe, it, expect } from "vitest";
import { srTreeFromJson } from "../src/sr/from-json";

// DICOM-JSON helpers (WADO-RS metadata shape: { vr, Value: [...] }).
const str = (vr: string, s: string | number) => ({ vr, Value: [s] });
const seq = (...items: Record<string, unknown>[]) => ({ vr: "SQ", Value: items });
const codeItem = (value: string, scheme: string, meaning: string) => ({
  "00080100": str("SH", value),
  "00080102": str("SH", scheme),
  "00080104": str("LO", meaning),
});

describe("srTreeFromJson", () => {
  it("parses a CONTAINER with TEXT, NUM (+units), and CODE children", () => {
    const srMeta = {
      "0040A040": str("CS", "CONTAINER"),
      "0040A043": seq(codeItem("111060", "DCM", "Report")),
      "0040A730": seq(
        {
          "0040A010": str("CS", "CONTAINS"),
          "0040A040": str("CS", "TEXT"),
          "0040A043": seq(codeItem("121071", "DCM", "Finding")),
          "0040A160": str("UT", "No acute abnormality."),
        },
        {
          "0040A010": str("CS", "CONTAINS"),
          "0040A040": str("CS", "NUM"),
          "0040A043": seq(codeItem("G-D705", "SRT", "Volume")),
          "0040A300": seq({
            "0040A30A": { vr: "DS", Value: [12.5] },
            "004008EA": seq(codeItem("ml", "UCUM", "ml")),
          }),
        },
        {
          "0040A010": str("CS", "CONTAINS"),
          "0040A040": str("CS", "CODE"),
          "0040A043": seq(codeItem("121070", "DCM", "Findings")),
          "0040A168": seq(codeItem("R-00339", "SRT", "Normal")),
        },
      ),
    };

    const tree = srTreeFromJson(srMeta);

    expect(tree.title).toBe("Report");
    expect(tree.root.valueType).toBe("CONTAINER");
    expect(tree.root.conceptName).toMatchObject({
      value: "111060",
      scheme: "DCM",
      meaning: "Report",
    });
    expect(tree.root.children).toHaveLength(3);

    const [text, num, code] = tree.root.children;
    expect(text).toMatchObject({
      valueType: "TEXT",
      relationship: "CONTAINS",
      conceptName: { meaning: "Finding" },
      text: "No acute abnormality.",
    });
    expect(num).toMatchObject({
      valueType: "NUM",
      conceptName: { meaning: "Volume" },
      num: { value: 12.5, unit: { meaning: "ml" } },
    });
    expect(code).toMatchObject({
      valueType: "CODE",
      conceptName: { meaning: "Findings" },
      code: { value: "R-00339", scheme: "SRT", meaning: "Normal" },
    });
  });

  it("recurses nested CONTAINERs and degrades unknown value types without dropping them", () => {
    const srMeta = {
      "0040A040": str("CS", "CONTAINER"),
      "0040A730": seq({
        "0040A010": str("CS", "CONTAINS"),
        "0040A040": str("CS", "CONTAINER"),
        "0040A043": seq(codeItem("121111", "DCM", "Summary")),
        "0040A730": seq({
          "0040A010": str("CS", "CONTAINS"),
          "0040A040": str("CS", "WAVEFORM"), // not a core text type
          "0040A043": seq(codeItem("XX", "DCM", "ECG")),
        }),
      }),
    };

    const tree = srTreeFromJson(srMeta);
    const summary = tree.root.children[0];
    expect(summary.valueType).toBe("CONTAINER");
    expect(summary.children[0]).toMatchObject({
      valueType: "WAVEFORM",
      conceptName: { meaning: "ECG" },
    });
  });
});
