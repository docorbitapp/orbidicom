import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Overlay from "../src/components/Overlay.vue";

const meta = {
  patientName: "DOE JANE",
  patientId: "PID-42",
  patientSex: "F",
  patientBirthDate: "1985-03-20",
  studyDescription: "CHEST CT",
  studyDate: "2024-01-15",
  seriesNumber: 3,
  seriesDescription: "Axial 1mm",
  instanceNumber: 57,
  rows: 512,
  columns: 512,
  sliceLocation: -120.5,
};

describe("Overlay", () => {
  it("renders patient, study, image position, and W/L in the corners", () => {
    const w = mount(Overlay, {
      props: { meta, wl: { ww: 1500, wc: -600 }, index: 56, count: 200, seriesLabel: "Axial 1mm" },
    });
    const text = w.text();
    expect(text).toContain("DOE JANE");
    expect(text).toContain("PID-42");
    expect(text).toContain("CHEST CT");
    expect(text).toContain("Axial 1mm");
    expect(text).toContain("57 / 200"); // index 56 -> display 57
    expect(text).toContain("512×512");
    expect(text).toContain("1500"); // window width
    expect(text).toContain("-600"); // window center
  });

  it("falls back to the series label when metadata carries no study/series text", () => {
    const w = mount(Overlay, {
      props: {
        meta: { modality: "NIfTI", rows: 256, columns: 256 },
        wl: null,
        index: 0,
        count: 64,
        seriesLabel: "brain.nii.gz",
      },
    });
    expect(w.text()).toContain("brain.nii.gz");
    // No patient block when there's no patient metadata.
    expect(w.find(".ovl__name").exists()).toBe(false);
  });

  it("renders nothing useful but does not throw when meta is null", () => {
    const w = mount(Overlay, {
      props: { meta: null, wl: null, index: 0, count: 1, seriesLabel: "" },
    });
    expect(w.find(".ovl__name").exists()).toBe(false);
  });

  it("omits the instance number when it only repeats the image position", () => {
    // index 44 → "Img 45 / 101"; instanceNumber 45 would duplicate the 45.
    const w = mount(Overlay, {
      props: { meta: { instanceNumber: 45 }, wl: null, index: 44, count: 101, seriesLabel: "x" },
    });
    expect(w.text()).toContain("45 / 101");
    expect(w.find(".ovl__inst").exists()).toBe(false);
  });

  it("shows the instance number when it differs from the image position", () => {
    const w = mount(Overlay, {
      props: { meta: { instanceNumber: 200 }, wl: null, index: 44, count: 101, seriesLabel: "x" },
    });
    expect(w.find(".ovl__inst").text()).toContain("200");
  });

  it("blurs the patient block in privacy mode but leaves it readable by default", () => {
    const open = mount(Overlay, {
      props: { meta, wl: null, index: 0, count: 1, seriesLabel: "x" },
    });
    expect(open.find(".ovl--tl").classes()).not.toContain("ovl--blur");

    const priv = mount(Overlay, {
      props: { meta, wl: null, index: 0, count: 1, seriesLabel: "x", privacy: true },
    });
    expect(priv.find(".ovl--tl").classes()).toContain("ovl--blur");
  });
});
