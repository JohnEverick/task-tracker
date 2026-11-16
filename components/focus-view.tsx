"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Inbox, Pause, Play, Plus } from "lucide-react";

import { FocalLogo } from "@/components/focal-logo";
import { ProjectTag } from "@/components/project-tag";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MAX_THREE } from "@/lib/config";
import { EXTEND_SECONDS, focusBlockSeconds } from "@/lib/focus";
import { formatClock } from "@/lib/format";
import { useFocal } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FocusView({ taskId }: { taskId: string | null }) {
  const f = useFocal();
  const router = useRouter();

  const three = f.bucket("three");
  const requested = taskId ? f.tasks.find((t) => t.id === taskId) : undefined;
  const task = requested ?? three.find((t) => !t.done);
  const index = task ? three.findIndex((t) => t.id === task.id) : -1;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/today");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="dark flex min-h-screen flex-col gap-10 bg-background px-5 pt-7 pb-12 text-foreground sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <FocalLogo />
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Focus{index >= 0 ? ` · task ${index + 1} of ${MAX_THREE}` : ""}
          </span>
        </div>
        <Button asChild variant="ghost" className="border border-border">
          <Link href="/today">
            Exit focus
            <kbd className="rounded-md border border-input px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
              Esc
            </kbd>
          </Link>
        </Button>
      </header>

      {task ? (
        // Keyed by task: switching tasks starts a fresh block.
        <FocusSession key={task.id} task={task} />
      ) : (
        <div className="flex flex-1 flex-col items-start justify-center gap-4">
          <h1 className="font-display text-5xl font-extrabold tracking-[-0.04em]">Nothing to focus on.</h1>
          <p className="text-lg text-muted-foreground">All three are done — or you haven&apos;t picked them yet.</p>
          <Button asChild variant="default" size="lg">
            <Link href="/today">Back to Today</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function FocusSession({ task }: { task: Task }) {
  const f = useFocal();
  const router = useRouter();

  const [total, setTotal] = React.useState(() => focusBlockSeconds(task.estimateMins));
  const [remaining, setRemaining] = React.useState(total);
  const [paused, setPaused] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [stepDraft, setStepDraft] = React.useState("");
  const [parked, setParked] = React.useState<string[]>([]);

  const finished = remaining === 0;
  const ticking = !paused && !finished;

  React.useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  React.useEffect(() => {
    const previous = document.title;
    document.title = `${formatClock(remaining)} · Focal`;
    return () => {
      document.title = previous;
    };
  }, [remaining]);

  const pct = total ? Math.round(((total - remaining) / total) * 100) : 0;

  function markDone() {
    if (!task.done) f.toggleDone(task.id);
    router.push("/today");
  }

  function extend() {
    setTotal((t) => t + EXTEND_SECONDS);
    setRemaining((r) => r + EXTEND_SECONDS);
    setPaused(false);
  }

  function park(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    f.add(text, task.projectId, "Parking lot");
    setParked((p) => [text, ...p]);
    setDraft("");
  }

  function addStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stepDraft.trim()) return;
    f.addStep(task.id, stepDraft);
    setStepDraft("");
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-12">
      <section aria-labelledby="focus-task" className="flex min-w-0 flex-[3_1_520px] flex-col gap-7">
        <div className="flex flex-col gap-3.5">
          <ProjectTag project={f.project(task.projectId)} className="text-xs" />
          <h1
            id="focus-task"
            className={cn(
              "max-w-[760px] font-display text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-[46px]",
              task.done && "line-through"
            )}
          >
            {task.title}
          </h1>
        </div>

        <div className="flex flex-col gap-3.5">
          <p
            role="timer"
            aria-live="off"
            aria-label="Time left"
            className="font-mono text-[96px] leading-[0.9] font-medium tracking-[-0.06em] tabular-nums sm:text-[176px]"
          >
            {formatClock(remaining)}
          </p>
          <Progress value={pct} className="h-1.5 max-w-[640px]" aria-label="Focus block progress" />
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {finished ? "Block complete" : paused ? "Paused" : "Session running"} · {pct}% of{" "}
            {Math.round(total / 60)} min block
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={finished}
            aria-label={paused ? "Resume timer" : "Pause timer"}
            className={cn(
              "flex size-[72px] items-center justify-center rounded-full text-white transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
              paused ? "bg-[#3A3E46] hover:bg-[#4A4F58]" : "bg-signal hover:bg-signal/90"
            )}
          >
            {paused ? (
              <Play className="size-6 fill-white" aria-hidden="true" />
            ) : (
              <Pause className="size-6 fill-white" aria-hidden="true" />
            )}
          </button>
          <Button variant="ghost" className="h-13 border border-border px-5" onClick={extend}>
            +5 min
          </Button>
          <Button className="h-13 px-6" onClick={markDone}>
            <Check className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
            Mark done
          </Button>
        </div>
      </section>

      <aside className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
        <section aria-labelledby="steps-heading" className="flex flex-col gap-3.5 rounded-[22px] border bg-card p-5.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="steps-heading" className="font-display text-xl font-bold tracking-[-0.02em]">
              Steps
            </h2>
            {task.steps.length > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                {task.steps.filter((s) => s.done).length} of {task.steps.length}
              </span>
            )}
          </div>
          {task.steps.length === 0 && (
            <p className="text-sm text-muted-foreground">Break it down so the first move is obvious.</p>
          )}
          <ul className="flex flex-col gap-1">
            {task.steps.map((step) => (
              <li key={step.id} className="flex min-h-11 items-center gap-3">
                <Checkbox
                  id={`step-${step.id}`}
                  checked={step.done}
                  onCheckedChange={() => f.toggleStep(task.id, step.id)}
                />
                <label
                  htmlFor={`step-${step.id}`}
                  className={cn(
                    "flex-1 cursor-pointer text-[15px] leading-snug",
                    step.done && "text-[#8B9088] line-through"
                  )}
                >
                  {step.text}
                </label>
              </li>
            ))}
          </ul>
          <form onSubmit={addStep} className="flex gap-2">
            <label htmlFor="new-step" className="sr-only">
              New step
            </label>
            <Input
              id="new-step"
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              placeholder="Add a step"
              autoComplete="off"
              className="bg-background"
            />
            <Button type="submit" size="icon" variant="secondary" aria-label="Add step" className="rounded-xl">
              <Plus aria-hidden="true" />
            </Button>
          </form>
        </section>

        <section aria-labelledby="park-heading" className="flex flex-col gap-3.5 rounded-[22px] border bg-card p-5.5">
          <div className="flex flex-col gap-1">
            <h2 id="park-heading" className="font-display text-xl font-bold tracking-[-0.02em]">
              Parking lot
            </h2>
            <p className="text-sm text-muted-foreground">
              Stray thought? Drop it here. It goes to Triage, not your head.
            </p>
          </div>
          <form onSubmit={park} className="flex gap-2">
            <label htmlFor="park-input" className="sr-only">
              New parking lot note
            </label>
            <Input
              id="park-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. check the contrast on the hero"
              autoComplete="off"
              className="bg-background"
            />
            <Button type="submit" className="rounded-xl">
              Park
            </Button>
          </form>
          {parked.length > 0 && (
            <ul aria-label="Parked this session" className="flex flex-col gap-2">
              {parked.map((text, i) => (
                <li key={`${text}-${i}`} className="flex items-start gap-2.5 text-sm leading-normal text-[#DADDE2]">
                  <Inbox className="mt-0.5 size-4 shrink-0 text-[#8B9088]" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
