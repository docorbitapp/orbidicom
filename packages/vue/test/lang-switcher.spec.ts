import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LangSwitcher from "../src/components/LangSwitcher.vue";
import { setLang, getLang } from "../src/i18n";

const ALL = [
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
  "ar",
  "fa",
  "bn",
  "vi",
  "uk",
];

const codesOf = (w: ReturnType<typeof mount>) =>
  w.findAll(".lang__opt").map((o) => o.attributes("id")?.replace("lang-opt-", ""));

describe("LangSwitcher", () => {
  beforeEach(() => setLang("en"));

  it("shows the active language and opens a searchable listbox of every shipped locale", async () => {
    const w = mount(LangSwitcher);
    expect(w.find(".lang__current").text()).toBe("English");
    expect(w.find(".lang__pop").exists()).toBe(false);

    await w.find(".lang__button").trigger("click");
    expect(codesOf(w)).toEqual(ALL);
  });

  it("switches the active language when an option is chosen and closes the popover", async () => {
    const w = mount(LangSwitcher);
    await w.find(".lang__button").trigger("click");

    const tr = w.findAll(".lang__opt").find((o) => o.attributes("id") === "lang-opt-tr")!;
    await tr.trigger("click");
    expect(getLang()).toBe("tr");
    expect(w.find(".lang__pop").exists()).toBe(false);
  });

  it("filters the list (diacritic-insensitive) and shows an empty state when nothing matches", async () => {
    const w = mount(LangSwitcher);
    await w.find(".lang__button").trigger("click");

    await w.find(".lang__search").setValue("francais"); // matches Français without the ç
    expect(codesOf(w)).toEqual(["fr"]);

    await w.find(".lang__search").setValue("zzz");
    expect(w.findAll(".lang__opt").length).toBe(0);
    expect(w.find(".lang__empty").exists()).toBe(true);
  });

  it("matches on the locale code too", async () => {
    const w = mount(LangSwitcher);
    await w.find(".lang__button").trigger("click");
    await w.find(".lang__search").setValue("ko");
    expect(codesOf(w)).toEqual(["ko"]);
  });

  it("commits the highlighted match on Enter", async () => {
    const w = mount(LangSwitcher);
    await w.find(".lang__button").trigger("click");
    await w.find(".lang__search").setValue("deutsch");
    await w.find(".lang__search").trigger("keydown", { key: "Enter" });
    expect(getLang()).toBe("de");
  });

  const rectAt =
    (top: number, height = 36) =>
    () =>
      ({
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

  it("opens downward when the trigger sits near the top of the viewport (mobile)", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const w = mount(LangSwitcher);
    (w.find(".lang__button").element as HTMLElement).getBoundingClientRect = rectAt(12);
    await w.find(".lang__button").trigger("click");
    const pop = w.find(".lang__pop");
    expect(pop.classes()).toContain("lang__pop--down");
    expect(pop.classes()).not.toContain("lang__pop--up");
  });

  it("opens upward when the trigger sits near the bottom dock of the viewport", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const w = mount(LangSwitcher);
    (w.find(".lang__button").element as HTMLElement).getBoundingClientRect = rectAt(760);
    await w.find(".lang__button").trigger("click");
    const pop = w.find(".lang__pop");
    expect(pop.classes()).toContain("lang__pop--up");
    expect(pop.classes()).not.toContain("lang__pop--down");
  });

  it("labels each language in the active UI language, keeping the endonym as a hint", async () => {
    setLang("tr");
    const w = mount(LangSwitcher);
    // Trigger shows the active language localized (Turkish → "Türkçe").
    expect(w.find(".lang__current").text()).toBe("Türkçe");

    await w.find(".lang__button").trigger("click");
    const ko = w.findAll(".lang__opt").find((o) => o.attributes("id") === "lang-opt-ko")!;
    expect(ko.find(".lang__opt-label").text()).toBe("Korece"); // localized name
    expect(ko.find(".lang__opt-native").text()).toBe("한국어"); // endonym hint
  });
});
