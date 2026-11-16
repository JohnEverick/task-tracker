"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFocal } from "@/lib/store";

export function CaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const f = useFocal();
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    f.add(title, projectId || null, "Quick capture");
    setTitle("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Capture a task</DialogTitle>
            <DialogDescription>
              It goes to your Triage inbox, not your three. Get it out of your head and keep going.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label htmlFor="capture-title" className="text-sm font-medium">
              What needs doing?
            </label>
            <Input
              id="capture-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix the footer links on the portfolio site"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="capture-project" className="text-sm font-medium">
              Project
            </label>
            <select
              id="capture-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-11 rounded-xl border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <option value="">No project</option>
              {f.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Add to inbox
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
