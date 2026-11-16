"use client";

import * as React from "react";
import Link from "next/link";

import { ProjectDot } from "@/components/project-tag";
import { Button } from "@/components/ui/button";
import { MAX_THREE } from "@/lib/config";
import { useFocal } from "@/lib/store";
import type { Bucket, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Choice = Extract<Bucket, "three" | "next" | "later" | "dropped">;

const CHOICES: { bucket: Choice; label: string }[] = [
  { bucket: "three", label: "The three" },
  { bucket: "next", label: "Next" },
  { bucket: "later", label: "Later" },
  { bucket: "dropped", label: "Drop" },
];

export default function TriagePage() {
  const f = useFocal();

  // Tasks sorted during this visit stay on screen so you can change your mind.
  const [touched, setTouched] = React.useState<string[]>([]);

  const visible = f.tasks
    .filter((t) => t.bucket === "inbox" || touched.includes(t.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sorted = visible.filter((t) => t.bucket !== "inbox");
  const three = f.bucket("three");
  const inboxLeft = visible.length - sorted.length;

  function choose(task: Task, bucket: Choice) {
    setTouched((prev) => (prev.includes(task.id) ? prev : [...prev, task.id]));
    f.move(task.id, task.bucket === bucket ? "inbox" : bucket);
  }

  const countOf = (b: Bucket) => sorted.filter((t) => t.bucket === b).length;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-9">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Triage</p>
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-[68px]">
          Sort it. Don&apos;t do it.
        </h1>
        <p className="max-w-[620px] text-[17px] leading-normal text-muted-foreground">
          {visible.length === 0
            ? "Nothing new captured. Press C anywhere to add something."
            : `${visible.length} task${visible.length === 1 ? "" : "s"} captured. Give each one a place — the three only has room for ${MAX_THREE}.`}
        </p>
      </header>

      <div className="flex flex-wrap items-start gap-7">
        <section aria-labelledby="inbox-heading" className="flex min-w-0 flex-[2_1_480px] flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="inbox-heading" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Inbox
            </h2>
            {visible.length > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                {sorted.length} of {visible.length} sorted
              </span>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-[18px] border-[1.5px] border-dashed border-input p-8 text-center">
              <p className="font-display text-2xl font-bold">Inbox zero.</p>
              <p className="mt-1 text-muted-foreground">Nothing is waiting for a decision.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((task) => {
                const project = f.project(task.projectId);
                const current = task.bucket;
                const dim = current === "later" || current === "dropped";
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "flex flex-wrap items-center gap-4 rounded-[18px] border py-4 pr-4 pl-5 transition-colors",
                      current === "inbox" ? "border-input bg-card shadow-[0_1px_0_var(--border)]" : dim ? "bg-[#F4F5F0]" : "bg-card"
                    )}
                  >
                    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                      <span
                        className={cn(
                          "text-base leading-snug font-semibold",
                          current === "dropped" && "text-muted-foreground line-through"
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="inline-flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                        <ProjectDot color={project?.color} />
                        {project?.name ?? "No project"}
                        {task.source && ` · ${task.source}`}
                      </span>
                    </div>

                    <div
                      role="group"
                      aria-label={`Place: ${task.title}`}
                      className="flex flex-wrap gap-1 rounded-full bg-background p-1"
                    >
                      {CHOICES.map((c) => {
                        const on = current === c.bucket;
                        const disabled = c.bucket === "three" && f.threeIsFull && !on;
                        return (
                          <button
                            key={c.bucket}
                            type="button"
                            aria-pressed={on}
                            disabled={disabled}
                            title={disabled ? "The three is full. Swap one out on Today first." : undefined}
                            onClick={() => choose(task, c.bucket)}
                            className={cn(
                              "h-10 rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                              on && c.bucket === "three" && "bg-signal text-signal-foreground",
                              on && c.bucket !== "three" && "bg-primary text-primary-foreground",
                              !on && !disabled && "hover:bg-accent",
                              disabled && "cursor-not-allowed text-[#8B9088] line-through"
                            )}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <section
            aria-labelledby="three-slots-heading"
            className="dark flex flex-col gap-4 rounded-[22px] bg-background p-6 text-foreground"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="three-slots-heading" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                The three
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {three.length} / {MAX_THREE}
              </span>
            </div>
            <ol className="flex flex-col gap-2.5">
              {Array.from({ length: MAX_THREE }, (_, i) => {
                const task = three[i];
                return (
                  <li
                    key={task?.id ?? `slot-${i}`}
                    className={cn(
                      "flex items-center gap-3.5 rounded-[14px] px-3.5 py-3",
                      task ? "bg-[#23262D]" : "border-[1.5px] border-dashed border-input text-muted-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-10 shrink-0 font-display text-3xl font-extrabold tracking-[-0.04em]",
                        task ? "text-signal" : "text-[#6B707A]"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className={cn("text-[15px] leading-snug font-medium", task?.done && "line-through")}>
                        {task?.title ?? "Open slot"}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                        {task ? (task.done ? "Done" : (f.project(task.projectId)?.name ?? "No project")) : "Pick from the inbox"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            {f.threeIsFull && (
              <p className="text-sm leading-normal text-muted-foreground">
                Full. To add another, swap one out on <Link href="/today" className="text-foreground underline underline-offset-4">Today</Link>.
              </p>
            )}
          </section>

          <section aria-label="Sorted this session" className="grid grid-cols-3 gap-2.5">
            {(
              [
                ["next", "to Next"],
                ["later", "to Later"],
                ["dropped", "dropped"],
              ] as const
            ).map(([bucket, label]) => (
              <div key={bucket} className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
                <span className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em]">
                  {countOf(bucket)}
                </span>
                <span className="text-[13px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-2 rounded-[18px] border-[1.5px] border-dashed border-input px-5 py-4.5">
            <p className="text-sm font-semibold">Ask of each task</p>
            <p className="text-sm leading-normal text-[#3F444C]">
              Would today feel like a failure without it? The three. Does it matter this week? Next. Otherwise,
              Later — or let it go.
            </p>
          </div>

          <Button asChild size="lg" variant={inboxLeft === 0 ? "default" : "outline"}>
            <Link href="/today">{inboxLeft === 0 ? "Inbox zero — back to Today" : "Finish later"}</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
