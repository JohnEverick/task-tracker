import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";

import { setPathname } from "../helpers/navigation-mock";
import { renderWithStore } from "../helpers/render";

function renderShell() {
  return renderWithStore(
    <AppShell>
      <p>Page content</p>
    </AppShell>
  );
}

const triageLink = () => screen.getByRole("link", { name: /triage/i });

describe("AppShell", () => {
  it("renders the page with navigation and counts", () => {
    renderShell();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /today/i })).toHaveTextContent("3");
    expect(triageLink()).toHaveTextContent("6");
  });

  it("marks the current page", () => {
    setPathname("/triage");
    renderShell();
    expect(triageLink()).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /today/i })).not.toHaveAttribute("aria-current");
  });

  it("opens capture with the C key and adds the task to the inbox", async () => {
    const { user, ids, task } = renderShell();

    await user.keyboard("c");
    const dialog = await screen.findByRole("dialog", { name: "Capture a task" });

    const submit = within(dialog).getByRole("button", { name: "Add to inbox" });
    expect(submit).toBeDisabled();

    // Typing "c" in the field must not reopen or close anything.
    await user.type(within(dialog).getByLabelText("What needs doing?"), "Practice coding challenge");
    await user.selectOptions(within(dialog).getByLabelText("Project"), "Learning");
    await user.click(submit);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const added = task(ids("inbox").at(-1)!);
    expect(added).toMatchObject({
      title: "Practice coding challenge",
      projectId: "p-learning",
      source: "Quick capture",
    });
    expect(triageLink()).toHaveTextContent("7");
  });

  it("opens capture from the sidebar button and can be cancelled", async () => {
    const { user, ids } = renderShell();

    await user.click(screen.getByRole("button", { name: /capture a task/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("What needs doing?"), "Never mind");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(ids("inbox")).toHaveLength(6);
  });

  it("ignores C with a modifier key", async () => {
    const { user } = renderShell();
    await user.keyboard("{Meta>}c{/Meta}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets demo data after confirmation", async () => {
    const { user, ids } = renderShell();
    const confirm = vi.spyOn(window, "confirm");

    await user.click(screen.getByRole("button", { name: /capture a task/i }));
    await user.type(await screen.findByLabelText("What needs doing?"), "Temporary");
    await user.click(screen.getByRole("button", { name: "Add to inbox" }));
    expect(ids("inbox")).toHaveLength(7);

    confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole("button", { name: /reset demo data/i }));
    expect(ids("inbox")).toHaveLength(7);

    confirm.mockReturnValueOnce(true);
    await user.click(screen.getByRole("button", { name: /reset demo data/i }));
    expect(ids("inbox")).toHaveLength(6);
  });
});
