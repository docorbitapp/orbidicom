/**
 * Registers the adapters that ship with core into the data-source factory
 * registry, so `createDataSource("dicomweb", { root })` works out of the box.
 * Imported for its side effect by the package barrel.
 */
import { registerDataSource } from "../plugins";
import { DicomWebDataSource, type DicomWebOptions } from "./dicomweb";
import { LocalDataSource, type LocalOptions } from "./local";
import { NiftiDataSource, type NiftiOptions } from "./nifti";
import { DicomJsonDataSource, type DicomJsonOptions } from "./dicomjson";

let registered = false;

export function registerBuiltinDataSources(): void {
  if (registered) return;
  registered = true;
  registerDataSource({
    id: "dicomweb",
    label: "DICOMweb (QIDO/WADO-RS)",
    create: (c) => new DicomWebDataSource(c as DicomWebOptions),
  });
  registerDataSource({
    id: "local",
    label: "Local files",
    create: (c) => new LocalDataSource((c as LocalOptions) ?? {}),
  });
  registerDataSource({
    id: "nifti",
    label: "NIfTI volume",
    create: (c) => new NiftiDataSource((c as NiftiOptions) ?? {}),
  });
  registerDataSource({
    id: "dicomjson",
    label: "DICOM-JSON document",
    create: (c) => new DicomJsonDataSource(c as DicomJsonOptions),
  });
}

registerBuiltinDataSources();
