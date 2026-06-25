import { describe, it, expect } from "vitest";
import { buildWadoRsImageId } from "../src/imageIds";

describe("buildWadoRsImageId", () => {
  it("builds a wadors id under the given root, defaulting to frame 1", () => {
    expect(
      buildWadoRsImageId({
        root: "/pacs/dicom-web",
        studyUid: "1.2",
        seriesUid: "3.4",
        sopUid: "5.6",
      }),
    ).toBe("wadors:/pacs/dicom-web/studies/1.2/series/3.4/instances/5.6/frames/1");
  });

  it("honors an explicit frame and an absolute root", () => {
    expect(
      buildWadoRsImageId({
        root: "https://pacs.example/dicom-web",
        studyUid: "1",
        seriesUid: "2",
        sopUid: "3",
        frame: 7,
      }),
    ).toBe("wadors:https://pacs.example/dicom-web/studies/1/series/2/instances/3/frames/7");
  });
});
