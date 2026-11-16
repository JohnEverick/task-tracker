import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TodayPage from "@/app/(app)/today/page";

import { renderWithStore, seedWith } from "../helpers/render";

const threeRegion = () => screen.getByRole("region", { name: "The three" });
const nextRegion = () => screen.getByRole("region", { name: "Next up" });
const threeTitles = () =>
  within(threeRegion())
    .getAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);

describe("Today", () => {
  it("shows the three priorities in order", () => {
    renderWithStore(<TodayPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Three things today." })).toBeInTheDocument();
    expect(threeTitles()).toEqual([
      "Ship the case study page for the redesign project",
      "Send the tailored application to Halden Studio",
      "Finish the TypeScript generics module",
    ]);
    expect(screen.getByText("0 of 3 done")).toBeInTheDocument();
  });

  it("starts focus on the first unfinished priority", async () => {
    const { user } = renderWithStore(<TodayPage />);
    expect(screen.getByRole("link", { name: /start focus on #1/i })).toHaveAttribute(
      "href",
      "/focus?task=t-case-study"
    );

    await user.click(screen.getByRole("button", { name: /^Mark done: Ship the case study/ }));

    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start focus on #2/i })).toHaveAttribute(
      "href",
      "/focus?task=t-application"
    );
  });

  it("swaps a Next task in for the last unfinished priority", async () => {
    const { user, ids } = renderWithStore(<TodayPage />);

    await user.click(
      within(nextRegion()).getByRole("button", {
        name: "Swap into the three: Reply to the recruiter from Corvid Health",
      })
    );

    expect(threeTitles()).toEqual([
      "Ship the case study page for the redesign project",
      "Send the tailored application to Halden Studio",
      "Reply to the recruiter from Corvid Health",
    ]);
    expect(within(nextRegion()).getByText("Finish the TypeScript generics module")).toBeInTheDocument();
    expect(ids("three")).toHaveLength(3);
    expect(ids("next")[0]).toBe("t-generics");
  });

  it("shows open slots and lets you fill them", async () => {
    const { user } = renderWithStore(<TodayPage />, {
      state: seedWith({ "t-generics": { bucket: "later" } }),
    });

    expect(within(threeRegion()).getByRole("heading", { name: "Open slot" })).toBeInTheDocument();
    await user.click(within(nextRegion()).getByRole("button", { name: /^Add to the three: Book a dentist/ }));

    expect(threeTitles()).toContain("Book a dentist appointment");
    expect(within(threeRegion()).queryByRole("heading", { name: "Open slot" })).not.toBeInTheDocument();
  });

  it("celebrates when all three are done and clears them for a new day", async () => {
    const { user, ids } = renderWithStore(<TodayPage />, {
      state: seedWith({
        "t-case-study": { done: true },
        "t-application": { done: true },
        "t-generics": { done: true },
      }),
    });

    expect(screen.getByRole("heading", { level: 1, name: "All three. Done." })).toBeInTheDocument();
    // Nothing left to swap out, so swapping is off.
    for (const button of within(nextRegion()).getAllByRole("button")) expect(button).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /clear finished/i }));

    expect(within(threeRegion()).getAllByRole("heading", { name: "Open slot" })).toHaveLength(3);
    expect(ids("archived")).toHaveLength(3);
  });

  it("shows planned time against the focus budget", () => {
    renderWithStore(<TodayPage />);
    // 90 + 45 + 60 minutes planned out of 5 hours.
    expect(screen.getByText("3h 15m")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "3h 15m planned of 5h" })).toBeInTheDocument();
  });

  it("points to Triage when Next is empty", () => {
    const empty = Object.fromEntries(
      ["t-recruiter", "t-walkthrough", "t-linkedin", "t-sysdesign", "t-dentist"].map((id) => [
        id,
        { bucket: "later" as const },
      ])
    );
    renderWithStore(<TodayPage />, { state: seedWith(empty) });
    expect(within(nextRegion()).getByRole("link", { name: "Triage your inbox" })).toHaveAttribute("href", "/triage");
  });
});
