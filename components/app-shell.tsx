"use client";

import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { CaptureDialog } from "@/components/capture-dialog";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [captureOpen, setCaptureOpen] = React.useState(false);

  // "C" opens quick capture from anywhere, unless you're typing.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "c" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      setCaptureOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar onCapture={() => setCaptureOpen(true)} />
      <main className="min-w-0 flex-1 px-5 pt-8 pb-14 sm:px-8 md:px-12 md:pt-10">{children}</main>
      <CaptureDialog open={captureOpen} onOpenChange={setCaptureOpen} />
    </div>
  );
}
