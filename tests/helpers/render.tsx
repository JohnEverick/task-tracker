import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createFocalStore } from "@/lib/focal-store";
import { inBucket } from "@/lib/reducer";
import { createSeed } from "@/lib/seed";
import { FocalProvider } from "@/lib/store";
import type { Bucket, FocalState } from "@/lib/types";

type Options = Omit<RenderOptions, "wrapper"> & { state?: FocalState };

/** Renders `ui` inside a fresh Focal store (seed data unless `state` is given). */
export function renderWithStore(ui: React.ReactElement, { state, ...options }: Options = {}) {
  const store = createFocalStore(state ?? createSeed());
  const user = userEvent.setup();
  const result = render(<FocalProvider store={store}>{ui}</FocalProvider>, options);

  const ids = (bucket: Bucket) => inBucket(store.getSnapshot().tasks, bucket).map((t) => t.id);
  const task = (id: string) => store.getSnapshot().tasks.find((t) => t.id === id);

  return { ...result, store, user, ids, task };
}

/** Seed data with some tasks moved, e.g. to open a slot in the three. */
export function seedWith(changes: Record<string, Partial<FocalState["tasks"][number]>>): FocalState {
  const seed = createSeed();
  return {
    ...seed,
    tasks: seed.tasks.map((t) => (changes[t.id] ? { ...t, ...changes[t.id] } : t)),
  };
}
