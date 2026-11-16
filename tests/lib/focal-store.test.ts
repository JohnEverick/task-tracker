import { describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "@/lib/config";
import { createFocalStore } from "@/lib/focal-store";
import { loadState, saveState } from "@/lib/persistence";
import { createSeed } from "@/lib/seed";
import type { FocalState } from "@/lib/types";

const tiny: FocalState = {
  projects: [{ id: "p", name: "P", color: "#000000" }],
  tasks: [
    {
      id: "only",
      title: "Stored task",
      projectId: "p",
      estimateMins: 10,
      bucket: "inbox",
      done: false,
      position: 0,
      steps: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
    },
  ],
};

describe("persistence", () => {
  it("round-trips state through localStorage", () => {
    saveState(tiny);
    expect(loadState()).toEqual(tiny);
  });

  it("returns null when nothing is stored", () => {
    expect(loadState()).toBeNull();
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["the wrong shape", JSON.stringify({ tasks: "nope" })],
    ["null", "null"],
  ])("ignores %s", (_label, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);
    expect(loadState()).toBeNull();
  });

  it("does not throw when storage is full", () => {
    const storage = { setItem: vi.fn(() => { throw new Error("QuotaExceeded"); }) } as unknown as Storage;
    expect(() => saveState(tiny, storage)).not.toThrow();
  });

  it("does nothing without storage", () => {
    expect(loadState(undefined)).toBeNull();
    expect(() => saveState(tiny, undefined)).not.toThrow();
  });
});

describe("createFocalStore", () => {
  it("serves the seed on the server snapshot and stored data on the client", () => {
    saveState(tiny);
    const initial = createSeed();
    const store = createFocalStore(initial);

    expect(store.getServerSnapshot()).toBe(initial);
    expect(store.getSnapshot()).toEqual(tiny);
  });

  it("keeps the same snapshot until something changes", () => {
    const store = createFocalStore();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("saves and notifies subscribers on a change", () => {
    const store = createFocalStore(tiny);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: "move", id: "only", bucket: "next" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().tasks[0].bucket).toBe("next");
    expect(loadState()?.tasks[0].bucket).toBe("next");
  });

  it("skips saving and notifying when nothing changes", () => {
    const store = createFocalStore(tiny);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: "add", title: "   ", projectId: null });

    expect(listener).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("stops notifying after unsubscribe", () => {
    const store = createFocalStore(tiny);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.dispatch({ type: "move", id: "only", bucket: "later" });
    expect(listener).not.toHaveBeenCalled();
  });
});
