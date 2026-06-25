import { describe, it, expect, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { t, setLang, getLang } from "../src/i18n";

describe("i18n", () => {
  beforeEach(() => setLang("en"));

  it("returns strings for the active language", () => {
    setLang("tr");
    expect(t("loading")).toBe("Yükleniyor…");
  });

  it("falls back to English for an unknown language", () => {
    setLang("xx");
    expect(t("loading")).toBe("Loading…");
    expect(getLang()).toBe("en"); // unknown language normalizes to en
  });

  it("re-renders translations reactively when the language changes", async () => {
    const Probe = defineComponent({ setup: () => () => h("span", t("cancel")) });
    const w = mount(Probe);
    expect(w.text()).toBe("Cancel");
    setLang("de");
    await nextTick();
    expect(w.text()).toBe("Abbrechen");
  });
});
