"use client";

/**
 * React bindings for the Focal store. Rules live in `reducer.ts`, storage in
 * `persistence.ts`. The max-three rule is enforced again in the database by
 * the trigger in `supabase/schema.sql`.
 */

import * as React from "react";

import { MAX_THREE } from "./config";
import { createFocalStore, type FocalStore } from "./focal-store";
import { inBucket } from "./reducer";
import type { Bucket, Project } from "./types";

export { inBucket };

const FocalContext = React.createContext<FocalStore | null>(null);

export function FocalProvider({ children, store }: { children: React.ReactNode; store?: FocalStore }) {
  const [instance] = React.useState(() => store ?? createFocalStore());
  return <FocalContext.Provider value={instance}>{children}</FocalContext.Provider>;
}

const subscribeNever = () => () => {};

/** False during SSR and hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

export function useFocal() {
  const store = React.useContext(FocalContext);
  if (!store) throw new Error("useFocal must be used inside <FocalProvider>");

  const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useHydrated();
  const { dispatch } = store;

  return React.useMemo(() => {
    const projectsById = new Map(state.projects.map((p) => [p.id, p] as const));
    const threeCount = state.tasks.filter((t) => t.bucket === "three").length;
    return {
      hydrated,
      tasks: state.tasks,
      projects: state.projects,
      threeIsFull: threeCount >= MAX_THREE,
      bucket: (b: Bucket) => inBucket(state.tasks, b),
      project: (id: string | null): Project | undefined => (id ? projectsById.get(id) : undefined),

      add: (title: string, projectId: string | null, source?: string) =>
        dispatch({ type: "add", title, projectId, source }),
      move: (id: string, bucket: Bucket) => dispatch({ type: "move", id, bucket }),
      promote: (id: string) => dispatch({ type: "promote", id }),
      toggleDone: (id: string) => dispatch({ type: "toggleDone", id }),
      toggleStep: (taskId: string, stepId: string) => dispatch({ type: "toggleStep", taskId, stepId }),
      addStep: (taskId: string, text: string) => dispatch({ type: "addStep", taskId, text }),
      newDay: () => dispatch({ type: "newDay" }),
      reset: () => dispatch({ type: "reset" }),
    };
  }, [state, dispatch, hydrated]);
}
