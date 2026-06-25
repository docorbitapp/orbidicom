import { describe, it, expect } from "vitest";
import { mergeConfig } from "../src/config";

describe("mergeConfig", () => {
  it("returns the base config when there are no query params", () => {
    expect(mergeConfig({ pacsUrl: "/dicom-web", studyUid: "1.2.3" }, "")).toEqual({
      pacsUrl: "/dicom-web",
      studyUid: "1.2.3",
    });
  });

  it("lets ?pacs= and ?study= override the base config", () => {
    expect(
      mergeConfig(
        { pacsUrl: "/dicom-web", studyUid: "1.2.3" },
        "?pacs=https://pacs.example/dicom-web&study=9.9.9",
      ),
    ).toEqual({ pacsUrl: "https://pacs.example/dicom-web", studyUid: "9.9.9" });
  });

  it("preserves dotted Study Instance UIDs from the URL", () => {
    expect(mergeConfig({}, "?study=1.2.840.113619.2.55.3.604688").studyUid).toBe(
      "1.2.840.113619.2.55.3.604688",
    );
  });

  it("trims whitespace and ignores present-but-empty params", () => {
    expect(mergeConfig({ pacsUrl: "/dicom-web" }, "?pacs=&study=%20%20")).toEqual({
      pacsUrl: "/dicom-web",
      studyUid: "",
    });
  });

  it("defaults to empty strings when nothing is configured", () => {
    expect(mergeConfig({}, "")).toEqual({ pacsUrl: "", studyUid: "" });
  });
});
