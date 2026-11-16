import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptySlot, ThreeCard } from "@/components/three-card";
import type { Project, Task } from "@/lib/types";

const project: Project = { id: "p", name: "Portfolio site", color: "#D9431E" };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Ship the case study",
    projectId: "p",
    why: "Recruiters want process.",
    estimateMins: 90,
    bucket: "three",
    done: false,
    position: 0,
    steps: [
      { id: "s1", text: "Outline", done: true },
      { id: "s2", text: "Publish", done: false },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("ThreeCard", () => {
  it("shows the number, title, reason, project, estimate and step progress", () => {
    render(<ThreeCard task={makeTask()} index={1} isCurrent={false} project={project} onToggle={() => {}} />);

    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Ship the case study" })).toBeInTheDocument();
    expect(screen.getByText("Recruiters want process.")).toBeInTheDocument();
    expect(screen.getByText("Portfolio site")).toBeInTheDocument();
    expect(screen.getByText("1h 30m · 1/2 steps")).toBeInTheDocument();
  });

  it("calls onToggle from the check button, which reflects the done state", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <ThreeCard task={makeTask()} index={0} isCurrent project={project} onToggle={onToggle} />
    );

    const check = screen.getByRole("button", { name: "Mark done: Ship the case study" });
    expect(check).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(check);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<ThreeCard task={makeTask({ done: true })} index={0} isCurrent={false} project={project} onToggle={onToggle} />);
    expect(screen.getByRole("button", { name: "Mark not done: Ship the case study" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("links to Focus mode only on the current card", () => {
    const { rerender } = render(
      <ThreeCard task={makeTask()} index={0} isCurrent project={project} onToggle={() => {}} />
    );
    expect(screen.getByRole("link", { name: /focus now/i })).toHaveAttribute("href", "/focus?task=t1");

    rerender(<ThreeCard task={makeTask()} index={0} isCurrent={false} project={project} onToggle={() => {}} />);
    expect(screen.queryByRole("link", { name: /focus now/i })).not.toBeInTheDocument();
  });

  it("falls back when there is no project or reason", () => {
    render(
      <ThreeCard task={makeTask({ why: undefined, steps: [] })} index={2} isCurrent={false} onToggle={() => {}} />
    );
    expect(screen.getByText("No project")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });
});

describe("EmptySlot", () => {
  it("shows an open slot with its number", () => {
    render(<EmptySlot index={2} />);
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open slot" })).toBeInTheDocument();
  });
});
