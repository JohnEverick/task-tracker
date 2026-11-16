/**
 * Where state is kept between visits. For the POC that's localStorage;
 * Supabase replaces these two functions later.
 */

import { STORAGE_KEY } from "./config";
import type { FocalState } from "./types";

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    // Access can throw (e.g. storage disabled by the browser).
    return undefined;
  }
}

export function loadState(storage: Storage | undefined = browserStorage()): FocalState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FocalState> | null;
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) return null;
    return { tasks: parsed.tasks, projects: parsed.projects };
  } catch {
    return null;
  }
}

export function saveState(state: FocalState, storage: Storage | undefined = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): the session still works in memory.
  }
}
