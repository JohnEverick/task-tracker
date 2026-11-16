import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectDot({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: color ?? "#8B9088" }}
    />
  );
}

export function ProjectTag({ project, className }: { project?: Project; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground",
        className
      )}
    >
      <ProjectDot color={project?.color} />
      {project?.name ?? "No project"}
    </span>
  );
}
