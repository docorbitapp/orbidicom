/** A Cornerstone tool class (constructor), e.g. WindowLevelTool. */
export type ToolClass = abstract new (...args: never[]) => object;

export interface ToolRegistration {
  tool: ToolClass;
  name: string;
  binding: "primary" | "secondary" | "passive";
  icon: string;
  label: Record<string, string>;
}

export interface WlPreset {
  modality: string;
  name: string;
  windowWidth: number;
  windowCenter: number;
}

const tools: ToolRegistration[] = [];
const presets: WlPreset[] = [];

export function registerTool(reg: ToolRegistration): void {
  if (!tools.some((t) => t.name === reg.name)) tools.push(reg);
}

export function listTools(): readonly ToolRegistration[] {
  return tools;
}

export function registerWindowPreset(p: WlPreset): void {
  if (!presets.some((x) => x.modality === p.modality && x.name === p.name)) presets.push(p);
}

export function listWindowPresets(modality?: string): readonly WlPreset[] {
  return modality ? presets.filter((p) => p.modality === modality) : presets;
}
