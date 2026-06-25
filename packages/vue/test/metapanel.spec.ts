import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MetaPanel from "../src/components/MetaPanel.vue";

const groups = [
  {
    id: "patient",
    rows: [
      { label: "Patient Name", value: "DOE JANE" },
      { label: "Patient ID", value: "PID-42" },
    ],
  },
  { id: "image", rows: [{ label: "Matrix", value: "512 × 512" }] },
];

describe("MetaPanel", () => {
  it("renders groups and their rows when open", () => {
    const w = mount(MetaPanel, { props: { open: true, groups } });
    const text = w.text();
    expect(text).toContain("DOE JANE");
    expect(text).toContain("PID-42");
    expect(text).toContain("512 × 512");
  });

  it("renders nothing when closed", () => {
    const w = mount(MetaPanel, { props: { open: false, groups } });
    expect(w.find(".metapanel").exists()).toBe(false);
  });

  it("shows an empty-state message when there are no groups", () => {
    const w = mount(MetaPanel, { props: { open: true, groups: [] } });
    expect(w.find(".metapanel__empty").exists()).toBe(true);
  });

  it("emits close from the close button and the backdrop", async () => {
    const w = mount(MetaPanel, { props: { open: true, groups } });
    await w.find(".metapanel__close").trigger("click");
    expect(w.emitted("close")).toBeTruthy();
  });
});
