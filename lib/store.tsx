"use client";

/**
 * Client-side store for the POC.
 *
 * All rules live in the reducer, so swapping persistence to Supabase later means
 * replacing `loadState` / `saveState` (or the dispatchers) with calls to the
 * database. The max-three rule is enforced again in the database by the trigger
 * in `supabase/schema.sql`.
 */

import * as React from "react";

import { MAX_THREE, STORAGE_KEY } from "./config";
import { createSeed } from "./seed";
import type { Bucket, FocalState, Project, Task } from "./types";

type Action =
  | { type: "hydrate"; state: FocalState }
  | { type: "reset" }
  | { type: "add"; title: string; projectId: string | null; source?: string; estimateMins?: number }
  | { type: "move"; id: string; bucket: Bucket }
  | { type: "promote"; id: string }
  | { type: "toggleDone"; id: string }
  | { type: "toggleStep"; taskId: string; stepId: string }
  | { type: "addStep"; taskId: string; text: string }
  | { type: "newDay" };

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const byPosition = (a: Task, b: Task) => a.position - b.position;

export function inBucket(tasks: Task[], bucket: Bucket): Task[] {
  return tasks.filter((t) => t.bucket === bucket).sort(byPosition);
}

function endPosition(tasks: Task[], bucket: Bucket): number {
  const list = inBucket(tasks, bucket);
  return list.length ? list[list.length - 1].position + 1 : 0;
}

function startPosition(tasks: Task[], bucket: Bucket): number {
  const list = inBucket(tasks, bucket);
  return list.length ? list[0].position - 1 : 0;
}

function patch(tasks: Task[], id: string, changes: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
}

function reducer(state: FocalState, action: Action): FocalState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "reset":
      return createSeed();

    case "add": {
      const title = action.title.trim();
      if (!title) return state;
      const task: Task = {
        id: uid(),
        title,
        projectId: action.projectId,
        estimateMins: action.estimateMins ?? 30,
        bucket: "inbox",
        done: false,
        position: endPosition(state.tasks, "inbox"),
        steps: [],
        source: action.source ?? "Quick capture",
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      return { ...state, tasks: [...state.tasks, task] };
    }

    case "move": {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || task.bucket === action.bucket) return state;
      // The rule: never more than three.
      if (action.bucket === "three" && inBucket(state.tasks, "three").length >= MAX_THREE) {
        return state;
      }
      return {
        ...state,
        tasks: patch(state.tasks, task.id, {
          bucket: action.bucket,
          position: endPosition(state.tasks, action.bucket),
        }),
      };
    }

    case "promote": {
      // Pull a task into the three. If there's an open slot, take it; otherwise
      // swap it for the last unfinished priority, which goes back to the top of Next.
      const incoming = state.tasks.find((t) => t.id === action.id);
      if (!incoming || incoming.bucket === "three") return state;
      const three = inBucket(state.tasks, "three");

      if (three.length < MAX_THREE) {
        return {
          ...state,
          tasks: patch(state.tasks, incoming.id, {
            bucket: "three",
            done: false,
            position: endPosition(state.tasks, "three"),
          }),
        };
      }

      const outgoing = [...three].reverse().find((t) => !t.done);
      if (!outgoing) return state;
      let tasks = patch(state.tasks, incoming.id, {
        bucket: "three",
        done: false,
        position: outgoing.position,
      });
      tasks = patch(tasks, outgoing.id, {
        bucket: "next",
        position: startPosition(state.tasks, "next"),
      });
      return { ...state, tasks };
    }

    case "toggleDone": {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task) return state;
      const done = !task.done;
      return {
        ...state,
        tasks: patch(state.tasks, task.id, {
          done,
          completedAt: done ? new Date().toISOString() : null,
        }),
      };
    }

    case "toggleStep":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, steps: t.steps.map((s) => (s.id === action.stepId ? { ...s, done: !s.done } : s)) }
            : t
        ),
      };

    case "addStep": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, steps: [...t.steps, { id: uid(), text, done: false }] } : t
        ),
      };
    }

    case "newDay":
      // Finished priorities leave the three, which frees their slots.
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.bucket === "three" && t.done ? { ...t, bucket: "archived" as const } : t
        ),
      };

    default:
      return state;
  }
}

function loadState(): FocalState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FocalState>;
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) return null;
    return { tasks: parsed.tasks, projects: parsed.projects };
  } catch {
    return null;
  }
}

function saveState(state: FocalState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode) — the session still works in memory.
  }
}

type Ctx = {
  state: FocalState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
};

const FocalContext = React.createContext<Ctx | null>(null);

export function FocalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, createSeed);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = loadState();
    if (stored) dispatch({ type: "hydrate", state: stored });
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const value = React.useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);
  return <FocalContext.Provider value={value}>{children}</FocalContext.Provider>;
}

export function useFocal() {
  const ctx = React.useContext(FocalContext);
  if (!ctx) throw new Error("useFocal must be used inside <FocalProvider>");
  const { state, dispatch, hydrated } = ctx;

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
