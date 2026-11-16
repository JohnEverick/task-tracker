import { cn } from "@/lib/utils";

export function FocalLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={cn("size-7", className)}>
      <circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2.75" className="fill-signal" />
    </svg>
  );
}
