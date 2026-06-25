import { describe, it, expect } from "vitest";
import { configScript } from "../src/config";

describe("configScript", () => {
  it("emits an empty config when no PACS/study is given (local mode)", () => {
    const js = configScript({});
    expect(js).toContain('pacsUrl: ""');
    expect(js).toContain('studyUid: ""');
    expect(js).toContain("window.__ORBIDICOM_CONFIG__");
  });

  it("embeds --pacs and --study", () => {
    const js = configScript({ pacs: "/dicom-web", study: "1.2.840.113619" });
    expect(js).toContain('pacsUrl: "/dicom-web"');
    expect(js).toContain('studyUid: "1.2.840.113619"');
  });

  it("sanitizes quotes, backslashes and newlines so values can't break out", () => {
    const js = configScript({ pacs: 'https://x/"; alert(1);//', study: "a\\b\nc" });
    expect(js).not.toContain('alert(1)";');
    expect(js).not.toMatch(/[\r\n]\s*alert/);
    // The string literals stay single-line and quote-balanced.
    expect(js).toContain('pacsUrl: "https://x/; alert(1);//"');
    expect(js).toContain('studyUid: "abc"');
  });
});
