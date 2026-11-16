/**
 * A tiny external store (subscribe / getSnapshot / dispatch) that React reads
 * with useSyncExternalStore. The server and the first client render both use
 * the seed; stored data is picked up right after hydration, without effects.
 */

import { loadState, saveState } from "./persistence";
import { reducer, type Action } from "./reducer";
import { createSeed } from "./seed";
import type { FocalState } from "./types";

export type FocalStore = {
  getSnapshot: () => FocalState;
  getServerSnapshot: () => FocalState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: Action) => void;
};

export function createFocalStore(initial: FocalState = createSeed()): FocalStore {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function ensureLoaded() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    const stored = loadState();
    if (stored) state = stored;
  }

  return {
    getSnapshot() {
      ensureLoaded();
      return state;
    },
    getServerSnapshot() {
      return initial;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(action) {
      ensureLoaded();
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      saveState(state);
      listeners.forEach((listener) => listener());
    },
  };
}
