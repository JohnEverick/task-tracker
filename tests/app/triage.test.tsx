import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TriagePage from "@/app/(app)/triage/page";

import { renderWithStore, seedWith } from "../helpers/render";

const placeGroup = (title: string) => screen.getByRole("group", { name: `Place: ${title}` });
const slotsRegion = () => screen.getByRole("region", { name: "The three" });

describe("Triage", () => {
  it("lists the inbox, oldest first", () => {
    renderWithStore(<TriagePage />);

    const groups = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(groups).toEqual([
      "Place: Fix the mobile nav overflow on the portfolio site",
      "Place: Ask Dana for a reference letter",
      "Place: Write the README for the task tracker repo",
      "Place: Renew library card",
      "Place: Watch the conference talk on design tokens",
      "Place: Prep a story for “tell me about a conflict”",
    ]);
    expect(screen.getByText("0 of 6 sorted")).toBeInTheDocument();
  });

  it("sorts a task and keeps it on screen so you can change your mind", async () => {
    const { user, task } = renderWithStore(<TriagePage />);
    const group = () => placeGroup("Renew library card");

    await user.click(within(group()).getByRole("button", { name: "Later" }));
    expect(within(group()).getByRole("button", { name: "Later" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 of 6 sorted")).toBeInTheDocument();
    expect(task("t-library")?.bucket).toBe("later");

    await user.click(within(group()).getByRole("button", { name: "Next" }));
    expect(task("t-library")?.bucket).toBe("next");

    // Clicking the chosen place again sends it back to the inbox.
    await user.click(within(group()).getByRole("button", { name: "Next" }));
    expect(task("t-library")?.bucket).toBe("inbox");
    expect(screen.getByText("0 of 6 sorted")).toBeInTheDocument();
  });

  it("counts where things went this session", async () => {
    const { user } = renderWithStore(<TriagePage />);
    await user.click(within(placeGroup("Renew library card")).getByRole("button", { name: "Drop" }));
    await user.click(within(placeGroup("Ask Dana for a reference letter")).getByRole("button", { name: "Next" }));

    const summary = screen.getByRole("region", { name: "Sorted this session" });
    expect(within(summary).getByText("to Next").previousSibling).toHaveTextContent("1");
    expect(within(summary).getByText("dropped").previousSibling).toHaveTextContent("1");
    expect(within(summary).getByText("to Later").previousSibling).toHaveTextContent("0");
  });

  it("won't add to the three while it is full", () => {
    renderWithStore(<TriagePage />);
    for (const button of screen.getAllByRole("button", { name: "The three" })) {
      expect(button).toBeDisabled();
    }
    expect(within(slotsRegion()).getByText(/Full\./)).toBeInTheDocument();
  });

  it("fills an open slot, then locks the rest", async () => {
    const { user, ids } = renderWithStore(<TriagePage />, {
      state: seedWith({ "t-generics": { bucket: "later" } }),
    });

    expect(within(slotsRegion()).getByText("Open slot")).toBeInTheDocument();
    await user.click(within(placeGroup("Ask Dana for a reference letter")).getByRole("button", { name: "The three" }));

    expect(within(slotsRegion()).getByText("Ask Dana for a reference letter")).toBeInTheDocument();
    expect(ids("three")).toContain("t-reference");
    expect(within(placeGroup("Renew library card")).getByRole("button", { name: "The three" })).toBeDisabled();
    // The task that took the slot can still be moved back out.
    expect(
      within(placeGroup("Ask Dana for a reference letter")).getByRole("button", { name: "The three" })
    ).toBeEnabled();
  });

  it("celebrates inbox zero", async () => {
    const { user } = renderWithStore(<TriagePage />);
    for (const group of screen.getAllByRole("group")) {
      await user.click(within(group).getByRole("button", { name: "Later" }));
    }
    expect(screen.getByRole("link", { name: "Inbox zero — back to Today" })).toHaveAttribute("href", "/today");
  });

  it("shows an empty state when nothing is waiting", () => {
    const allSorted = Object.fromEntries(
      ["t-mobile-nav", "t-reference", "t-readme", "t-library", "t-talk", "t-conflict"].map((id) => [
        id,
        { bucket: "later" as const },
      ])
    );
    renderWithStore(<TriagePage />, { state: seedWith(allSorted) });
    expect(screen.getByText("Inbox zero.")).toBeInTheDocument();
  });
});
