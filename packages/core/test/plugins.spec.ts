import { describe, it, expect } from "vitest";
import {
  registerPlugin,
  listPlugins,
  registerDataSource,
  listDataSources,
  createDataSource,
} from "../src/plugins";
import { listTools, listWindowPresets, type ToolRegistration } from "../src/registry";
import type { DataSource } from "../src/datasource";

const fakeSource = { capabilities: {} } as unknown as DataSource;
const fakeTool: ToolRegistration = {
  tool: class {} as unknown as ToolRegistration["tool"],
  name: "ZZTool",
  binding: "primary",
  icon: "<svg/>",
  label: { en: "ZZ" },
};

describe("plugins / data-source registry", () => {
  it("registers a backend factory and instantiates it by id", () => {
    registerDataSource({ id: "fake-src", label: "Fake", create: () => fakeSource });
    expect(listDataSources().some((d) => d.id === "fake-src")).toBe(true);
    expect(createDataSource("fake-src", {})).toBe(fakeSource);
  });

  it("ignores a duplicate id (first registration wins)", () => {
    registerDataSource({ id: "dup", label: "first", create: () => fakeSource });
    registerDataSource({ id: "dup", label: "second", create: () => fakeSource });
    expect(listDataSources().filter((d) => d.id === "dup")).toHaveLength(1);
    expect(listDataSources().find((d) => d.id === "dup")?.label).toBe("first");
  });

  it("throws a helpful error for an unknown id", () => {
    expect(() => createDataSource("nope", {})).toThrow(/Unknown data source "nope"/);
  });

  it("registerPlugin fans tools/presets/dataSources out to the registries, idempotent by name", () => {
    registerPlugin({
      name: "zz-plugin",
      tools: [fakeTool],
      windowPresets: [{ modality: "ZZ", name: "ZZ Window", windowWidth: 100, windowCenter: 50 }],
      dataSources: [{ id: "zz-ds", label: "ZZ", create: () => fakeSource }],
    });
    expect(listTools().some((t) => t.name === "ZZTool")).toBe(true);
    expect(listWindowPresets("ZZ").some((p) => p.name === "ZZ Window")).toBe(true);
    expect(listDataSources().some((d) => d.id === "zz-ds")).toBe(true);
    expect(listPlugins().some((p) => p.name === "zz-plugin")).toBe(true);

    // Re-registering the same name is a no-op (no duplicate, no re-fan-out).
    registerPlugin({ name: "zz-plugin", tools: [] });
    expect(listPlugins().filter((p) => p.name === "zz-plugin")).toHaveLength(1);
  });
});
