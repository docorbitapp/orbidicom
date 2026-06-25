import { describe, it, expect } from "vitest";
// Import the specific modules, not the barrel: the barrel re-exports the
// cornerstone-backed modules, which eagerly load the dicom-image-loader worker
// and crash under the Node test env. Anything needing the engine mocks it.
import { registerTool, listTools } from "../src/registry";
import type { DataSource } from "../src/datasource";

describe("tool registry", () => {
  it("registers and lists a tool", () => {
    registerTool({
      tool: class {},
      name: "length",
      binding: "primary",
      icon: "ruler",
      label: { en: "Length" },
    });
    expect(listTools().map((t) => t.name)).toContain("length");
  });
});

describe("DataSource contract", () => {
  it("a minimal in-memory source satisfies the interface", async () => {
    const source: DataSource = {
      capabilities: { downloadArchive: false, encapsulatedPdf: false, multiStudy: false },
      async getSeries() {
        return [{ seriesInstanceUID: "1.2.3", modality: "CT", numberOfFrames: 1 }];
      },
      async getImageIds() {
        return ["wadors:example"];
      },
    };
    const series = await source.getSeries(["study-1"]);
    expect(series[0]?.seriesInstanceUID).toBe("1.2.3");
    expect(await source.getImageIds(series[0]!)).toEqual(["wadors:example"]);
  });
});
