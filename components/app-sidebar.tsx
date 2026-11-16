"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Plus, RotateCcw, Target, Timer } from "lucide-react";

import { FocalLogo } from "@/components/focal-logo";
import { ProjectDot } from "@/components/project-tag";
import { Button } from "@/components/ui/button";
import { useFocal } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppSidebar({ onCapture }: { onCapture: () => void }) {
  const pathname = usePathname();
  const f = useFocal();

  const openThree = f.bucket("three").filter((t) => !t.done).length;
  const inboxCount = f.bucket("inbox").length;
  const live = f.tasks.filter((t) => t.bucket !== "archived" && t.bucket !== "dropped");

  const nav = [
    { href: "/today", label: "Today", icon: Target, count: openThree, highlight: false },
    { href: "/triage", label: "Triage", icon: Inbox, count: inboxCount, highlight: inboxCount > 0 },
    { href: "/focus", label: "Focus mode", icon: Timer, count: null, highlight: false },
  ];

  return (
    <aside className="flex shrink-0 flex-col gap-5 border-b px-4 py-5 md:sticky md:top-0 md:h-screen md:w-64 md:gap-8 md:overflow-y-auto md:border-r md:border-b-0 md:py-7">
      <Link href="/today" className="flex items-center gap-2.5 self-start rounded-lg px-2">
        <FocalLogo />
        <span className="font-display text-[23px] font-extrabold tracking-[-0.03em]">Focal</span>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap gap-1 md:flex-col">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors",
                active ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-accent"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              {item.label}
              {item.count !== null && (
                <span
                  className={cn(
                    "ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-xs",
                    item.highlight && !active
                      ? "bg-signal text-signal-foreground"
                      : active
                        ? "text-[#B8BCC4]"
                        : "text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="hidden flex-col gap-1 md:flex">
        <p className="mb-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          Projects
        </p>
        <ul className="flex flex-col gap-0.5">
          {f.projects.map((p) => (
            <li key={p.id} className="flex min-h-10 items-center gap-3 rounded-lg px-3">
              <ProjectDot color={p.color} />
              {p.name}
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {live.filter((t) => t.projectId === p.id).length}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 md:mt-auto">
        <Button variant="dashed" className="h-12 justify-start rounded-[14px] px-3.5" onClick={onCapture}>
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          Capture a task
          <kbd className="ml-auto rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
            C
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden justify-start rounded-lg px-3 font-medium text-muted-foreground md:inline-flex"
          onClick={() => {
            if (window.confirm("Reset to the demo data? Your changes will be lost.")) f.reset();
          }}
        >
          <RotateCcw aria-hidden="true" />
          Reset demo data
        </Button>
      </div>
    </aside>
  );
}
