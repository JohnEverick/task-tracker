import { describe, expect, it } from "vitest";

import { MAX_THREE } from "@/lib/config";
import { inBucket, reducer } from "@/lib/reducer";
import type { Bucket, FocalState, Task } from "@/lib/types";

function task(overrides: Partial<Task> & Pick<Task, "id" | "bucket">): Task {
  return {
    title: overrides.id,
    projectId: null,
    estimateMins: 30,
    done: false,
    position: 0,
    steps: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

function state(tasks: Task[]): FocalState {
  return { projects: [], tasks };
}

const ids = (s: FocalState, bucket: Bucket) => inBucket(s.tasks, bucket).map((t) => t.id);
const find = (s: FocalState, id: string) => s.tasks.find((t) => t.id === id)!;

/** A full three (a, b, c), two tasks in Next and one in the inbox. */
function fullThree(): FocalState {
  return state([
    task({ id: "a", bucket: "three", position: 0 }),
    task({ id: "b", bucket: "three", position: 1 }),
    task({ id: "c", bucket: "three", position: 2 }),
    task({ id: "n1", bucket: "next", position: 0 }),
    task({ id: "n2", bucket: "next", position: 1 }),
    task({ id: "i1", bucket: "inbox", position: 0 }),
  ]);
}

describe("inBucket", () => {
  it("returns only that bucket, sorted by position", () => {
    const s = state([
      task({ id: "x", bucket: "next", position: 5 }),
      task({ id: "y", bucket: "inbox", position: 0 }),
      task({ id: "z", bucket: "next", position: -1 }),
    ]);
    expect(ids(s, "next")).toEqual(["z", "x"]);
  });
});

describe("add", () => {
  it("appends a trimmed task to the end of the inbox", () => {
    const next = reducer(fullThree(), { type: "add", title: "  Write tests  ", projectId: "p1" });
    const added = next.tasks[next.tasks.length - 1];

    expect(added).toMatchObject({
      title: "Write tests",
      projectId: "p1",
      bucket: "inbox",
      done: false,
      estimateMins: 30,
      source: "Quick capture",
      steps: [],
      completedAt: null,
    });
    expect(added.position).toBe(1);
    expect(ids(next, "inbox")).toEqual(["i1", added.id]);
    expect(new Date(added.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("keeps the given source", () => {
    const next = reducer(fullThree(), { type: "add", title: "Idea", projectId: null, source: "Parking lot" });
    expect(next.tasks.at(-1)?.source).toBe("Parking lot");
  });

  it("gives every task a unique id", () => {
    let s = fullThree();
    for (let i = 0; i < 20; i++) s = reducer(s, { type: "add", title: `Task ${i}`, projectId: null });
    expect(new Set(s.tasks.map((t) => t.id)).size).toBe(s.tasks.length);
  });

  it("ignores a blank title", () => {
    const s = fullThree();
    expect(reducer(s, { type: "add", title: "   ", projectId: null })).toBe(s);
  });
});

describe("move", () => {
  it("moves a task to the end of the target bucket", () => {
    const next = reducer(fullThree(), { type: "move", id: "i1", bucket: "next" });
    expect(ids(next, "next")).toEqual(["n1", "n2", "i1"]);
    expect(ids(next, "inbox")).toEqual([]);
  });

  it("refuses to add a fourth task to the three", () => {
    const s = fullThree();
    expect(reducer(s, { type: "move", id: "i1", bucket: "three" })).toBe(s);
  });

  it("fills an open slot in the three", () => {
    const s = reducer(fullThree(), { type: "move", id: "c", bucket: "later" });
    const next = reducer(s, { type: "move", id: "i1", bucket: "three" });
    expect(ids(next, "three")).toEqual(["a", "b", "i1"]);
  });

  it("does nothing for the same bucket or an unknown id", () => {
    const s = fullThree();
    expect(reducer(s, { type: "move", id: "n1", bucket: "next" })).toBe(s);
    expect(reducer(s, { type: "move", id: "nope", bucket: "later" })).toBe(s);
  });
});

describe("promote", () => {
  it("takes an open slot when there is one", () => {
    const s = reducer(fullThree(), { type: "move", id: "b", bucket: "later" });
    const next = reducer(s, { type: "promote", id: "n2" });
    expect(ids(next, "three")).toEqual(["a", "c", "n2"]);
    expect(ids(next, "next")).toEqual(["n1"]);
  });

  it("swaps out the last unfinished priority when the three is full", () => {
    const next = reducer(fullThree(), { type: "promote", id: "n2" });

    expect(ids(next, "three")).toEqual(["a", "b", "n2"]);
    // The swapped-out task goes to the top of Next so it isn't lost.
    expect(ids(next, "next")).toEqual(["c", "n1"]);
    // The incoming task takes the outgoing task's slot.
    expect(find(next, "n2").position).toBe(2);
  });

  it("never swaps out a finished priority", () => {
    const s = reducer(fullThree(), { type: "toggleDone", id: "c" });
    const next = reducer(s, { type: "promote", id: "n1" });
    expect(ids(next, "three")).toEqual(["a", "n1", "c"]);
    expect(ids(next, "next")).toEqual(["b", "n2"]);
  });

  it("does nothing when all three are finished", () => {
    let s = fullThree();
    for (const id of ["a", "b", "c"]) s = reducer(s, { type: "toggleDone", id });
    expect(reducer(s, { type: "promote", id: "n1" })).toBe(s);
  });

  it("marks the incoming task as not done", () => {
    const s = state([task({ id: "x", bucket: "next", done: true })]);
    expect(find(reducer(s, { type: "promote", id: "x" }), "x")).toMatchObject({ bucket: "three", done: false });
  });

  it("does nothing for a task already in the three or an unknown id", () => {
    const s = fullThree();
    expect(reducer(s, { type: "promote", id: "a" })).toBe(s);
    expect(reducer(s, { type: "promote", id: "nope" })).toBe(s);
  });

  it(`never lets the three grow past ${MAX_THREE}`, () => {
    let s = fullThree();
    for (const id of ["n1", "n2", "i1", "c", "b", "a"]) {
      s = reducer(s, { type: "promote", id });
      s = reducer(s, { type: "move", id, bucket: "three" });
      expect(ids(s, "three").length).toBeLessThanOrEqual(MAX_THREE);
    }
  });
});

describe("toggleDone", () => {
  it("marks done with a timestamp, and back again", () => {
    const done = reducer(fullThree(), { type: "toggleDone", id: "a" });
    expect(find(done, "a").done).toBe(true);
    expect(find(done, "a").completedAt).toEqual(expect.any(String));

    const undone = reducer(done, { type: "toggleDone", id: "a" });
    expect(find(undone, "a")).toMatchObject({ done: false, completedAt: null });
  });

  it("does nothing for an unknown id", () => {
    const s = fullThree();
    expect(reducer(s, { type: "toggleDone", id: "nope" })).toBe(s);
  });
});

describe("steps", () => {
  const withSteps = () =>
    state([
      task({
        id: "a",
        bucket: "three",
        steps: [
          { id: "s1", text: "One", done: false },
          { id: "s2", text: "Two", done: false },
        ],
      }),
    ]);

  it("toggles only the chosen step", () => {
    const next = reducer(withSteps(), { type: "toggleStep", taskId: "a", stepId: "s2" });
    expect(find(next, "a").steps.map((s) => s.done)).toEqual([false, true]);
  });

  it("ignores an unknown task or step", () => {
    const s = withSteps();
    expect(reducer(s, { type: "toggleStep", taskId: "a", stepId: "nope" })).toBe(s);
    expect(reducer(s, { type: "toggleStep", taskId: "nope", stepId: "s1" })).toBe(s);
  });

  it("adds a trimmed step to the end", () => {
    const next = reducer(withSteps(), { type: "addStep", taskId: "a", text: "  Three " });
    expect(find(next, "a").steps.map((s) => s.text)).toEqual(["One", "Two", "Three"]);
    expect(find(next, "a").steps[2].done).toBe(false);
  });

  it("ignores a blank step", () => {
    const s = withSteps();
    expect(reducer(s, { type: "addStep", taskId: "a", text: "  " })).toBe(s);
  });
});

describe("newDay", () => {
  it("archives finished priorities and keeps open ones", () => {
    const s = reducer(fullThree(), { type: "toggleDone", id: "b" });
    const next = reducer(s, { type: "newDay" });
    expect(ids(next, "three")).toEqual(["a", "c"]);
    expect(ids(next, "archived")).toEqual(["b"]);
  });

  it("does nothing when nothing is finished", () => {
    const s = fullThree();
    expect(reducer(s, { type: "newDay" })).toBe(s);
  });
});

describe("hydrate and reset", () => {
  it("hydrate replaces the state", () => {
    const stored = state([task({ id: "z", bucket: "later" })]);
    expect(reducer(fullThree(), { type: "hydrate", state: stored })).toBe(stored);
  });

  it("reset restores the demo data", () => {
    const next = reducer(state([]), { type: "reset" });
    expect(ids(next, "three")).toHaveLength(MAX_THREE);
    expect(next.projects.length).toBeGreaterThan(0);
  });
});
