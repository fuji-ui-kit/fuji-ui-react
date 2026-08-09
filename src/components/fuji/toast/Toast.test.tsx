import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ToastProvider, Toaster, useToast } from "./Toast";

function Fixture({
  variant,
  description,
}: {
  variant?: "success" | "warning" | "danger" | "info";
  description?: string;
}) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast.add({ title: "Changes saved", description, timeout: 0, data: { variant } })}
    >
      Show toast
    </button>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <ToastProvider>
      {ui}
      <Toaster />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  it("shows a toast's title and description when added", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture description="Your edits are safe." />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(screen.getByText("Your edits are safe.")).toBeInTheDocument();
  });

  it("dismisses via its own close button", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(await screen.findByText("Changes saved")).toBeInTheDocument();

    // Base UI's own Toast Close hides itself from the accessibility tree
    // (`aria-hidden`) until it has focus or the toast stack is expanded, so
    // a background toast's dismiss control doesn't clutter screen-reader
    // navigation - it's not exposed via role until then, but it's still a
    // real, clickable element. Query past that instead of by role here.
    const dismissButton = document.body.querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')!;
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText("Changes saved")).not.toBeInTheDocument();
    });
  });

  it("exposes its close button to assistive tech once it receives focus", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Changes saved");

    const dismissButton = document.body.querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')!;
    expect(dismissButton).toHaveAttribute("aria-hidden", "true");

    act(() => dismissButton.focus());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Dismiss" })).toBe(dismissButton);
    });
  });

  it("renders a status-tone icon only when a variant is set", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture variant="success" />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Changes saved");

    // Toast content is portaled to document.body, outside the render container.
    expect(document.body.querySelector("svg")).toBeInTheDocument();
  });

  it("has no obvious accessibility violations with an open toast", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture variant="danger" description="Could not save." />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Changes saved");

    // Toast content is portaled to document.body, so assert against that,
    // not the (empty, for portaled content) render() container.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
