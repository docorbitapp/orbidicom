import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LangSwitcher from "../src/components/LangSwitcher.vue";
import { setLang, getLang } from "../src/i18n";

describe("LangSwitcher", () => {
  beforeEach(() => setLang("en"));

  it("lists the shipped locales and switches the active language on change", async () => {
    const w = mount(LangSwitcher);
    const opts = w.findAll(".lang__select option").map((o) => o.attributes("value"));
    expect(opts).toEqual(["en", "tr", "de", "es"]);
    expect((w.find(".lang__select").element as HTMLSelectElement).value).toBe("en");

    await w.find(".lang__select").setValue("tr");
    expect(getLang()).toBe("tr");
  });
});
