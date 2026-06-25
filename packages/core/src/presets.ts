import { registerWindowPreset, listWindowPresets, type WlPreset } from "./registry";

const CT: Omit<WlPreset, "modality">[] = [
  { name: "Soft Tissue", windowWidth: 400, windowCenter: 40 },
  { name: "Bone", windowWidth: 2000, windowCenter: 500 },
  { name: "Lung", windowWidth: 1500, windowCenter: -600 },
  { name: "Brain", windowWidth: 80, windowCenter: 40 },
  { name: "Abdomen", windowWidth: 350, windowCenter: 50 },
];

let seeded = false;

/** Register the built-in CT windows. Idempotent. */
export function seedDefaultPresets(): void {
  if (seeded) return;
  for (const p of CT) registerWindowPreset({ modality: "CT", ...p });
  seeded = true;
}

/**
 * Fixed W/L windows are only standardized for CT (Hounsfield units). Other
 * modalities (MR, US, …) have image-specific intensities, so fixed presets are
 * meaningless — return none and the toolbar hides the control (the W/L drag tool
 * and Reset still apply for those).
 */
export function windowPresetsFor(modality: string): readonly WlPreset[] {
  seedDefaultPresets();
  return modality?.toUpperCase() === "CT" ? listWindowPresets("CT") : [];
}
