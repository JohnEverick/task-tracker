import { describe, expect, it } from "vitest";

import { MAX_THREE } from "@/lib/config";
import { inBucket } from "@/lib/reducer";
import { createSeed } from "@/lib/seed";

describe("createSeed", () => {
  const seed = createSeed();

  it(`starts with exactly ${MAX_THREE} open priorities`, () => {
    const three = inBucket(seed.tasks, "three");
    expect(three).toHaveLength(MAX_THREE);
    expect(three.every((t) => !t.done)).toBe(true);
  });

  it("has something in every working bucket", () => {
    for (const bucket of ["inbox", "next", "later"] as const) {
      expect(inBucket(seed.tasks, bucket).length).toBeGreaterThan(0);
    }
  });

  it("uses unique task and step ids", () => {
    const taskIds = seed.tasks.map((t) => t.id);
    const stepIds = seed.tasks.flatMap((t) => t.steps.map((s) => s.id));
    expect(new Set(taskIds).size).toBe(taskIds.length);
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it("only points at projects that exist", () => {
    const projectIds = new Set(seed.projects.map((p) => p.id));
    for (const t of seed.tasks) expect(projectIds.has(t.projectId ?? "")).toBe(true);
  });

  it("returns a fresh copy each time", () => {
    expect(createSeed().tasks).not.toBe(createSeed().tasks);
  });
});
