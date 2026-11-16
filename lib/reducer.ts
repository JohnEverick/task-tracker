/**
 * Every rule in Focal lives here, as a pure function of (state, action).
 * The UI, the persistence layer and the tests all go through it.
 */

import { MAX_THREE } from "./config";
import { createSeed } from "./seed";
import type { Bucket, FocalState, Task } from "./types";

export type Action =
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

/** Tasks in one bucket, in display order. */
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

/**
 * Returns the same `state` object when an action changes nothing,
 * so callers can skip saving and re-rendering.
 */
export function reducer(state: FocalState, action: Action): FocalState {
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

    case "toggleStep": {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task || !task.steps.some((s) => s.id === action.stepId)) return state;
      return {
        ...state,
        tasks: patch(state.tasks, task.id, {
          steps: task.steps.map((s) => (s.id === action.stepId ? { ...s, done: !s.done } : s)),
        }),
      };
    }

    case "addStep": {
      const text = action.text.trim();
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!text || !task) return state;
      return {
        ...state,
        tasks: patch(state.tasks, task.id, { steps: [...task.steps, { id: uid(), text, done: false }] }),
      };
    }

    case "newDay": {
      // Finished priorities leave the three, which frees their slots.
      if (!state.tasks.some((t) => t.bucket === "three" && t.done)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.bucket === "three" && t.done ? { ...t, bucket: "archived" as const } : t
        ),
      };
    }

    default:
      return state;
  }
}
