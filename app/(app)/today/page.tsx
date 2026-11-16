"use client";

import Link from "next/link";
import { ArrowUpDown, Info, Play, Sparkles } from "lucide-react";

import { ProjectDot } from "@/components/project-tag";
import { EmptySlot, ThreeCard } from "@/components/three-card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FOCUS_BUDGET_MINS, MAX_THREE } from "@/lib/config";
import { formatMins } from "@/lib/format";
import { useFocal } from "@/lib/store";
import { useTodayLabel } from "@/lib/use-today-label";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const f = useFocal();
  const dateLabel = useTodayLabel();

  const three = f.bucket("three");
  const next = f.bucket("next");
  const later = f.bucket("later");

  const current = three.find((t) => !t.done);
  const doneCount = three.filter((t) => t.done).length;
  const planned = three.reduce((sum, t) => sum + t.estimateMins, 0);
  const remaining = three.filter((t) => !t.done).reduce((sum, t) => sum + t.estimateMins, 0);
  const plannedPct = Math.min(100, Math.round((planned / FOCUS_BUDGET_MINS) * 100));
  const hasOpenSlot = three.length < MAX_THREE;
  const canPromote = hasOpenSlot || three.some((t) => !t.done);
  const allDone = three.length > 0 && doneCount === three.length;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <p className="min-h-[18px] font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {dateLabel}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-[68px]">
            {allDone ? "All three. Done." : "Three things today."}
          </h1>
          <p className="max-w-[560px] text-[17px] leading-normal text-muted-foreground">
            {allDone
              ? "That's the day. Clear them to free the slots, or call it here."
              : "Everything else is parked. Finish these and the day counts."}
          </p>
        </div>

        {current ? (
          <Button asChild size="lg" className="h-13 pr-6 pl-3">
            <Link href={`/focus?task=${encodeURIComponent(current.id)}`}>
              <span className="flex size-7 items-center justify-center rounded-full bg-signal">
                <Play className="size-3 fill-white text-white" aria-hidden="true" />
              </span>
              Start focus on #{three.indexOf(current) + 1}
            </Link>
          </Button>
        ) : doneCount > 0 ? (
          <Button size="lg" variant="outline" onClick={f.newDay}>
            <Sparkles aria-hidden="true" />
            Clear finished
          </Button>
        ) : null}
      </header>

      <section aria-labelledby="three-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="three-heading" className="font-display text-[22px] font-bold tracking-[-0.02em]">
            The three
          </h2>
          <div className="flex items-center gap-3.5">
            <div className="flex w-[120px] gap-1.5" aria-hidden="true">
              {Array.from({ length: MAX_THREE }, (_, i) => (
                <span
                  key={i}
                  className={cn("h-1.5 flex-1 rounded-full", three[i]?.done ? "bg-signal" : "bg-[#D0D3CA]")}
                />
              ))}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {doneCount} of {MAX_THREE} done
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: MAX_THREE }, (_, i) => {
            const task = three[i];
            if (!task) return <EmptySlot key={`empty-${i}`} index={i} />;
            return (
              <ThreeCard
                key={task.id}
                task={task}
                index={i}
                isCurrent={task.id === current?.id}
                project={f.project(task.projectId)}
                onToggle={() => f.toggleDone(task.id)}
              />
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="next-heading" className="flex min-w-0 flex-[2_1_440px] flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="next-heading" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Next up
            </h2>
            <span className="text-sm text-muted-foreground">
              {hasOpenSlot
                ? "You have an open slot — pull one in."
                : "Want one of these today? Swap it for an unfinished three."}
            </span>
          </div>

          {next.length === 0 ? (
            <div className="rounded-[18px] border-[1.5px] border-dashed border-input p-6 text-muted-foreground">
              Nothing queued. <Link href="/triage" className="font-semibold text-foreground underline underline-offset-4">Triage your inbox</Link> to fill Next.
            </div>
          ) : (
            <ul className="flex flex-col gap-px overflow-hidden rounded-[18px] border bg-[#E2E5DD]">
              {next.map((task) => {
                const project = f.project(task.projectId);
                return (
                  <li key={task.id} className="flex items-center gap-4 bg-card py-3 pr-3.5 pl-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[15px] font-medium">{task.title}</span>
                      <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                        <ProjectDot color={project?.color} />
                        {project?.name ?? "No project"} · {formatMins(task.estimateMins)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      disabled={!canPromote}
                      onClick={() => f.promote(task.id)}
                      aria-label={`${hasOpenSlot ? "Add to the three" : "Swap into the three"}: ${task.title}`}
                    >
                      <ArrowUpDown aria-hidden="true" />
                      {hasOpenSlot ? "Add" : "Swap in"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <Card>
            <CardTitle>Today&apos;s shape</CardTitle>
            <p className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em]">
                {formatMins(planned)}
              </span>
              <span className="text-muted-foreground">planned of {formatMins(FOCUS_BUDGET_MINS)} focus time</span>
            </p>
            <Progress value={plannedPct} aria-label={`${formatMins(planned)} planned of ${formatMins(FOCUS_BUDGET_MINS)}`} />
            <p className="text-sm text-muted-foreground">
              {remaining ? `${formatMins(remaining)} still to do` : "Nothing left to do"} · the rest is buffer for
              the unexpected
            </p>
          </Card>

          <Card className="flex-row items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-base font-semibold">{later.length} parked in Later</h2>
              <span className="text-sm text-muted-foreground">Out of sight until your weekly review.</span>
            </div>
            <Button asChild variant="secondary">
              <Link href="/triage">Triage</Link>
            </Button>
          </Card>

          <div className="flex items-start gap-3.5 rounded-[18px] border-[1.5px] border-dashed border-input px-5 py-5">
            <Info className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-sm leading-normal">
              <strong className="font-semibold">The rule:</strong> there are only ever three. Adding one means
              letting one go back to Next.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
