import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SrView from "../src/components/SrView.vue";
import type { SrTree } from "@orbidicom/core";

const tree: SrTree = {
  title: "Report",
  root: {
    valueType: "CONTAINER",
    conceptName: { meaning: "Report" },
    children: [
      {
        valueType: "TEXT",
        conceptName: { meaning: "Finding" },
        text: "No acute abnormality.",
        children: [],
      },
      {
        valueType: "NUM",
        conceptName: { meaning: "Volume" },
        num: { value: 12.5, unit: { meaning: "ml" } },
        children: [],
      },
      {
        valueType: "CONTAINER",
        conceptName: { meaning: "Section" },
        children: [
          {
            valueType: "CODE",
            conceptName: { meaning: "Severity" },
            code: { meaning: "Mild" },
            children: [],
          },
        ],
      },
    ],
  },
};

describe("SrView", () => {
  it("renders the title and the content tree (headings + values, nested)", () => {
    const w = mount(SrView, { props: { tree } });
    const text = w.text();
    expect(text).toContain("Report"); // title
    expect(text).toContain("Finding");
    expect(text).toContain("No acute abnormality.");
    expect(text).toContain("Volume");
    expect(text).toContain("12.5 ml"); // NUM with unit
    expect(text).toContain("Severity"); // nested under Section
    expect(text).toContain("Mild");
  });

  it("escapes SR content (no HTML injection)", () => {
    const evil: SrTree = {
      title: "X",
      root: {
        valueType: "CONTAINER",
        children: [
          {
            valueType: "TEXT",
            conceptName: { meaning: "N" },
            text: "<img src=x onerror=alert(1)>",
            children: [],
          },
        ],
      },
    };
    const w = mount(SrView, { props: { tree: evil } });
    expect(w.find("img").exists()).toBe(false); // rendered as text, not markup
    expect(w.text()).toContain("<img src=x onerror=alert(1)>");
  });

  it("shows the error state when error is set", () => {
    const w = mount(SrView, { props: { tree, error: true } });
    expect(w.find(".srview__err").exists()).toBe(true);
    expect(w.text()).not.toContain("No acute abnormality.");
  });
});
