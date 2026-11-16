"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { ProjectTag } from "@/components/project-tag";
import { formatMins } from "@/lib/format";
import type { Project, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  index: number;
  isCurrent: boolean;
  project?: Project;
  onToggle: () => void;
};

export function ThreeCard({ task, index, isCurrent, project, onToggle }: Props) {
  const tone = task.done ? "done" : isCurrent ? "current" : "open";
  const stepsDone = task.steps.filter((s) => s.done).length;

  return (
    <article
      className={cn(
        "flex min-h-[310px] flex-col justify-between gap-7 rounded-[22px] border p-6 transition-colors",
        // "dark" flips the colour tokens for this card only.
        tone === "current" && "dark border-transparent bg-background text-foreground",
        tone === "open" && "bg-card text-card-foreground",
        tone === "done" && "border-[1.5px] border-dashed border-input bg-transparent text-muted-foreground"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "font-display text-[92px] leading-[0.8] font-extrabold tracking-[-0.05em]",
            tone === "current" && "text-signal",
            tone === "open" && "text-foreground",
            tone === "done" && "text-[#8B9088]"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={task.done}
          aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            task.done
              ? "border-signal bg-signal text-signal-foreground"
              : "border-input text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
          )}
        >
          <Check className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>

      <div>
        <ProjectTag project={project} />
        <h3
          className={cn(
            "mt-3 font-display text-[26px] leading-[1.12] font-bold tracking-[-0.02em]",
            task.done && "line-through decoration-2"
          )}
        >
          {task.title}
        </h3>
        {task.why && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{task.why}</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {formatMins(task.estimateMins)}
          {task.steps.length > 0 && ` · ${stepsDone}/${task.steps.length} steps`}
        </span>
        {tone === "current" && (
          <Link
            href={`/focus?task=${encodeURIComponent(task.id)}`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-input px-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span aria-hidden="true" className="size-[7px] rounded-full bg-signal" />
            Focus now
          </Link>
        )}
      </div>
    </article>
  );
}

export function EmptySlot({ index }: { index: number }) {
  return (
    <div className="flex min-h-[310px] flex-col justify-between gap-7 rounded-[22px] border-[1.5px] border-dashed border-input p-6 text-muted-foreground">
      <span
        aria-hidden="true"
        className="font-display text-[92px] leading-[0.8] font-extrabold tracking-[-0.05em] text-[#B9BDB3]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3 className="font-display text-[22px] font-bold tracking-[-0.02em] text-foreground">Open slot</h3>
        <p className="mt-2 text-[15px] leading-relaxed">Pull one in from Next up — or enjoy the room.</p>
      </div>
    </div>
  );
}
