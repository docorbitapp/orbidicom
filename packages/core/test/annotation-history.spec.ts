import { describe, it, expect, vi } from "vitest";

// annotation-history.ts imports the cornerstone barrels at module load; stub them
// so the pure history logic runs in node. The controller under test takes an
// injected state adapter, so the real annotation.state is never called here.
vi.mock("@cornerstonejs/tools", () => ({
  annotation: {
    state: {
      getAnnotation: vi.fn(),
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
    },
  },
  Enums: {
    Events: { ANNOTATION_COMPLETED: "a", ANNOTATION_REMOVED: "c" },
  },
}));
vi.mock("@cornerstonejs/core", () => ({
  eventTarget: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
}));

import {
  createAnnotationHistory,
  type AnnotationStateAdapter,
  type HistoryAnnotation,
  type AnnotationHistory,
} from "../src/cornerstone/annotation-history";

const lengthAnn = (uid: string): HistoryAnnotation => ({
  annotationUID: uid,
  metadata: { toolName: "Length", FrameOfReferenceUID: "FOR1" },
  data: { handles: { points: [[0, 0, 0]] } },
});

/**
 * A fake Cornerstone annotation store that mimics the real one's behaviour: a
 * map of UID -> annotation, where `removeAnnotation` synchronously re-fires the
 * REMOVED notification (as Cornerstone's eventTarget does) by calling the
 * controller's recordDelete. `addAnnotation` fires ANNOTATION_ADDED, which the
 * history does NOT listen to, so it records nothing — matching reality.
 */
function makeFake() {
  const store = new Map<string, HistoryAnnotation>();
  let history!: AnnotationHistory;
  const adapter: AnnotationStateAdapter = {
    getAnnotation: (uid) => store.get(uid),
    addAnnotation: (ann, _group) => {
      store.set(ann.annotationUID ?? "", ann);
    },
    removeAnnotation: (uid) => {
      const removed = store.get(uid);
      store.delete(uid);
      if (removed) history.recordDelete(removed); // CS fires ANNOTATION_REMOVED here
    },
  };
  return {
    store,
    adapter,
    attach: (h: AnnotationHistory) => {
      history = h;
    },
  };
}

function setup() {
  const fake = makeFake();
  const history = createAnnotationHistory(fake.adapter);
  fake.attach(history);
  return { history, store: fake.store };
}

describe("createAnnotationHistory", () => {
  it("undoes a create by removing the annotation", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");

    expect(history.canUndo()).toBe(true);
    expect(history.undo()).toBe(true);

    expect(store.has("u1")).toBe(false);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("does not self-record a delete while undoing a create (isApplying guard)", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");

    history.undo(); // removeAnnotation re-fires recordDelete; guard must drop it

    // If the guard failed, the spurious delete would sit on the undo stack.
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("redoes a create by re-adding the (latest) annotation", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");
    history.undo();
    expect(store.has("u1")).toBe(false);

    expect(history.redo()).toBe(true);
    expect(store.has("u1")).toBe(true);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("preserves edits made after creation across an undo/redo round trip", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");
    // user drags a handle after drawing (edits aren't tracked as steps)
    store.get("u1")!.data = { handles: { points: [[9, 9, 9]] } };

    history.undo();
    history.redo();

    expect(store.get("u1")!.data).toEqual({ handles: { points: [[9, 9, 9]] } });
  });

  it("undoes a delete by re-adding it, and redo removes it again", () => {
    const { history, store } = setup();
    const ann = lengthAnn("u1");
    store.set("u1", ann);
    history.recordDelete(ann); // user deleted it
    store.delete("u1"); // (the user's delete already removed it from CS state)

    expect(history.undo()).toBe(true);
    expect(store.has("u1")).toBe(true);

    expect(history.redo()).toBe(true);
    expect(store.has("u1")).toBe(false);
  });

  it("clears the redo stack when a new action is recorded", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");
    history.undo();
    expect(history.canRedo()).toBe(true);

    store.set("u2", lengthAnn("u2"));
    history.recordCreate("u2", "FOR1"); // new action invalidates redo

    expect(history.canRedo()).toBe(false);
  });

  it("returns false from undo/redo when the stacks are empty", () => {
    const { history } = setup();
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });

  it("reset() clears both stacks without mutating annotation state", () => {
    const { history, store } = setup();
    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");
    history.undo();

    history.reset();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(store.has("u1")).toBe(false); // reset doesn't touch CS state
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const { history, store } = setup();
    const cb = vi.fn();
    const off = history.subscribe(cb);

    store.set("u1", lengthAnn("u1"));
    history.recordCreate("u1", "FOR1");
    expect(cb).toHaveBeenCalledTimes(1);

    history.undo();
    expect(cb).toHaveBeenCalledTimes(2);

    off();
    history.redo();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
