import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FocusView } from "@/components/focus-view";

import { router } from "../helpers/navigation-mock";
import { renderWithStore, seedWith } from "../helpers/render";

const clock = () => screen.getByRole("timer");
const tick = (seconds: number) => act(() => vi.advanceTimersByTime(seconds * 1000));

describe("FocusView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("focuses the first unfinished priority by default", () => {
    renderWithStore(<FocusView taskId={null} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Ship the case study page for the redesign project" })
    ).toBeInTheDocument();
    expect(screen.getByText(/task 1 of 3/)).toBeInTheDocument();
    // A 90-minute estimate gives a 90-minute block.
    expect(clock()).toHaveTextContent("90:00");
  });

  it("focuses the requested task", () => {
    renderWithStore(<FocusView taskId="t-application" />);
    expect(screen.getByRole("heading", { level: 1, name: "Send the tailored application to Halden Studio" })).toBeInTheDocument();
    expect(clock()).toHaveTextContent("45:00");
  });

  it("counts down, pauses, resumes and extends", () => {
    renderWithStore(<FocusView taskId={null} />);

    tick(3);
    expect(clock()).toHaveTextContent("89:57");
    expect(document.title).toBe("89:57 · Focal");

    fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
    tick(10);
    expect(clock()).toHaveTextContent("89:57");
    expect(screen.getByText(/Paused/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume timer" }));
    tick(2);
    expect(clock()).toHaveTextContent("89:55");

    fireEvent.click(screen.getByRole("button", { name: "+5 min" }));
    expect(clock()).toHaveTextContent("94:55");
    expect(screen.getByText(/of 95 min block/)).toBeInTheDocument();
  });

  it("stops at zero and says the block is complete", () => {
    renderWithStore(<FocusView taskId="t-dentist" />);
    // A 5-minute task still gets the 15-minute minimum.
    expect(clock()).toHaveTextContent("15:00");

    tick(15 * 60 + 30);
    expect(clock()).toHaveTextContent("00:00");
    expect(screen.getByText(/Block complete/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause timer" })).toBeDisabled();
  });

  it("checks off and adds steps", () => {
    const { task } = renderWithStore(<FocusView taskId={null} />);
    expect(screen.getByText("2 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Write “what I’d do differently”" }));
    expect(task("t-case-study")?.steps[2].done).toBe(true);
    expect(screen.getByText("3 of 4")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("New step"), { target: { value: "Share the link" } });
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    expect(screen.getByRole("checkbox", { name: "Share the link" })).not.toBeChecked();
    expect(screen.getByLabelText("New step")).toHaveValue("");
  });

  it("sends parked thoughts to the inbox", () => {
    const { ids, task } = renderWithStore(<FocusView taskId={null} />);

    fireEvent.change(screen.getByLabelText("New parking lot note"), { target: { value: "Check hero contrast" } });
    fireEvent.click(screen.getByRole("button", { name: "Park" }));

    const parked = task(ids("inbox").at(-1)!);
    expect(parked).toMatchObject({ title: "Check hero contrast", source: "Parking lot", projectId: "p-portfolio" });
    expect(screen.getByRole("list", { name: "Parked this session" })).toHaveTextContent("Check hero contrast");
    expect(screen.getByLabelText("New parking lot note")).toHaveValue("");
  });

  it("ignores an empty parking lot note", () => {
    const { ids } = renderWithStore(<FocusView taskId={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Park" }));
    expect(ids("inbox")).toHaveLength(6);
  });

  it("marks the task done and goes back to Today", () => {
    const { task } = renderWithStore(<FocusView taskId={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark done" }));
    expect(task("t-case-study")?.done).toBe(true);
    expect(router.push).toHaveBeenCalledWith("/today");
  });

  it("exits with Escape", () => {
    renderWithStore(<FocusView taskId={null} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(router.push).toHaveBeenCalledWith("/today");
  });

  it("shows an empty state when nothing is left", () => {
    renderWithStore(<FocusView taskId={null} />, {
      state: seedWith({
        "t-case-study": { done: true },
        "t-application": { done: true },
        "t-generics": { done: true },
      }),
    });
    expect(screen.getByRole("heading", { name: "Nothing to focus on." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Today" })).toHaveAttribute("href", "/today");
  });
});
