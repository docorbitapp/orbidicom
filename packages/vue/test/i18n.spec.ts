import { describe, it, expect, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { t, setLang, getLang, LOCALES, STRINGS } from "../src/i18n";

describe("i18n", () => {
  beforeEach(() => setLang("en"));

  it("every locale defines the same key set as English (no silent gaps)", () => {
    // The non-English locales are independent literals, not constrained by the
    // I18nKey type, so a missing key would only surface as a silent English
    // fallback at runtime. Assert key-set parity to catch it.
    const enKeys = Object.keys(STRINGS.en).sort();
    expect(enKeys.length).toBeGreaterThan(0);
    for (const [code, table] of Object.entries(STRINGS)) {
      expect(Object.keys(table).sort(), `locale "${code}"`).toEqual(enKeys);
    }
  });

  it("ships the fifteen built-in locales", () => {
    expect(LOCALES.map((l) => l.code)).toEqual([
      "en",
      "tr",
      "de",
      "es",
      "fr",
      "it",
      "pt",
      "ru",
      "zh",
      "ja",
      "ko",
      "hi",
      "id",
      "nl",
      "pl",
    ]);
  });

  it("translates a key in each shipped locale (not just falling back to English)", () => {
    const samples: Record<string, string> = {
      fr: "Chargement…",
      it: "Caricamento…",
      pt: "Carregando…",
      ru: "Загрузка…",
      zh: "加载中…",
      ja: "読み込み中…",
      ko: "로딩 중…",
      hi: "लोड हो रहा है…",
      id: "Memuat…",
      nl: "Laden…",
      pl: "Ładowanie…",
    };
    for (const [code, expected] of Object.entries(samples)) {
      setLang(code);
      expect(t("loading")).toBe(expected);
    }
  });

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
