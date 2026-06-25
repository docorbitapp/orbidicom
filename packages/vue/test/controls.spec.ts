import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Controls from "../src/components/Controls.vue";

describe("Controls", () => {
  it("renders host slot actions, the language switcher, and the scroll hint", () => {
    const w = mount(Controls, {
      props: { open: false },
      slots: { default: '<button class="host-action">New study</button>' },
    });
    expect(w.find(".host-action").exists()).toBe(true);
    expect(w.find(".lang__select").exists()).toBe(true);
    expect(w.find(".dock__hint").exists()).toBe(true);
  });

  it("reflects the parent-controlled open state on the panel (mobile dropdown)", () => {
    const closed = mount(Controls, { props: { open: false } });
    expect(closed.find(".dock__panel--open").exists()).toBe(false);
    const open = mount(Controls, { props: { open: true } });
    expect(open.find(".dock__panel--open").exists()).toBe(true);
  });
});
