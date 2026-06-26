import { describe, it, expect } from "vitest";
import { resolveHotkey, normalizeKey, DEFAULT_KEYMAP } from "../src/hotkeys";

describe("resolveHotkey", () => {
  it("maps tool letters to tool commands (case-insensitive)", () => {
    expect(resolveHotkey({ key: "z" })).toEqual({ kind: "tool", tool: "Zoom" });
    expect(resolveHotkey({ key: "W" })).toEqual({ kind: "tool", tool: "WindowLevel" });
    expect(resolveHotkey({ key: "b" })).toEqual({ kind: "tool", tool: "Rectangle" });
  });

  it("maps view-transform keys", () => {
    expect(resolveHotkey({ key: "i" })).toEqual({ kind: "invert" });
    expect(resolveHotkey({ key: "r" })).toEqual({ kind: "rotate" });
    expect(resolveHotkey({ key: "f" })).toEqual({ kind: "flipH" });
    expect(resolveHotkey({ key: "0" })).toEqual({ kind: "reset" });
  });

  it("maps space to cine and arrows to slice scrolling", () => {
    expect(resolveHotkey({ key: " " })).toEqual({ kind: "cine" });
    expect(resolveHotkey({ key: "ArrowRight" })).toEqual({ kind: "scroll", delta: 1 });
    expect(resolveHotkey({ key: "ArrowDown" })).toEqual({ kind: "scroll", delta: 1 });
    expect(resolveHotkey({ key: "ArrowLeft" })).toEqual({ kind: "scroll", delta: -1 });
    expect(resolveHotkey({ key: "ArrowUp" })).toEqual({ kind: "scroll", delta: -1 });
  });

  it("maps digit keys to 0-based preset indices", () => {
    expect(resolveHotkey({ key: "1" })).toEqual({ kind: "preset", index: 0 });
    expect(resolveHotkey({ key: "5" })).toEqual({ kind: "preset", index: 4 });
    expect(resolveHotkey({ key: "9" })).toEqual({ kind: "preset", index: 8 });
  });

  it("returns null for unbound keys", () => {
    expect(resolveHotkey({ key: "q" })).toBeNull();
    expect(resolveHotkey({ key: "Enter" })).toBeNull();
  });

  it("ignores keys held with Ctrl/Cmd/Alt so browser & OS shortcuts pass through", () => {
    expect(resolveHotkey({ key: "w", ctrlKey: true })).toBeNull();
    expect(resolveHotkey({ key: "r", metaKey: true })).toBeNull();
    expect(resolveHotkey({ key: "z", altKey: true })).toBeNull();
    // Shift is fine — it doesn't change our single-key bindings.
    expect(resolveHotkey({ key: "Z" })).toEqual({ kind: "tool", tool: "Zoom" });
  });

  it("honors a custom keymap (remap / disable)", () => {
    const map = { x: DEFAULT_KEYMAP.z };
    expect(resolveHotkey({ key: "x" }, map)).toEqual({ kind: "tool", tool: "Zoom" });
    expect(resolveHotkey({ key: "z" }, map)).toBeNull();
  });

  it("normalizeKey lower-cases single chars but keeps named keys verbatim", () => {
    expect(normalizeKey("A")).toBe("a");
    expect(normalizeKey("ArrowLeft")).toBe("ArrowLeft");
    expect(normalizeKey(" ")).toBe(" ");
  });
});
