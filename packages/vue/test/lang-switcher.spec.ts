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
});
