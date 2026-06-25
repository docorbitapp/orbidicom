import { describe, it, expect } from "vitest";
import { NiftiDataSource } from "../src/datasources/nifti";

describe("NiftiDataSource", () => {
  it("loads a .nii.gz file as a single axial series of slices", async () => {
    const ds = new NiftiDataSource({
      loadImageIds: async () => [
        "nifti:blob:x?frame=0",
        "nifti:blob:x?frame=1",
        "nifti:blob:x?frame=2",
      ],
    });
    const n = await ds.addFile(new File([new Uint8Array([1])], "brain.nii.gz"));
    expect(n).toBe(3);

    const series = await ds.getSeries();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      seriesDescription: "brain.nii.gz",
      studyInstanceUID: "local",
      numberOfFrames: 3,
    });
    expect(await ds.getImageIds()).toHaveLength(3);
  });

  it("exposes no series before a file is added", async () => {
    const ds = new NiftiDataSource({ loadImageIds: async () => [] });
    expect(await ds.getSeries()).toEqual([]);
  });
});
