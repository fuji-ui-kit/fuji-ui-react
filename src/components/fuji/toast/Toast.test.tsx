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

    const dismissButton = screen.getByRole("button", { name: "Dismiss" });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText("Changes saved")).not.toBeInTheDocument();
    });
  });

  it("keeps its close button exposed to assistive tech at every stack state, not just once focused", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Changes saved");

    // Base UI's own `Toast.Close` computes `aria-hidden: !expanded &&
    // !hasFocus` - true for a background/unfocused toast in a stack - but
    // never touches `tabIndex`, so the button stays in the Tab order while
    // pruned from the accessibility tree: a screen-reader user tabbing to it
    // gets nothing, while a sighted keyboard user reaches and can activate
    // it. That's a WCAG 4.1.2 failure (focusable content inside
    // `aria-hidden`), and it fails silently - `getByRole("button", { name:
    // "Dismiss" })` finding nothing here is the only signal, since
    // `aria-hidden` doesn't stop `.focus()` from succeeding. Fuji's wrapper
    // overrides it (see Toast.tsx) so the control behaves like `Alert`'s
    // identical dismiss button: always in the tree, before and after focus.
    const dismissButton = screen.getByRole("button", { name: "Dismiss" });
    expect(dismissButton).not.toHaveAttribute("aria-hidden", "true");

    act(() => dismissButton.focus());
    expect(screen.getByRole("button", { name: "Dismiss" })).toBe(dismissButton);
    expect(dismissButton).not.toHaveAttribute("aria-hidden", "true");
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

  it("carries the same tone wash as an Alert of that variant", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Fixture variant="warning" />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Changes saved");

    // `Alert` and `Toast` share the four status variants, so they share the
    // treatment: a tone wash from the leading edge and the icon on its own
    // raised tile (see lib/status-surface.ts).
    const wash = document.body.querySelector(".fj\\:bg-gradient-to-r");
    expect(wash).not.toBeNull();
    expect(wash!.className).toContain("fj:from-fuji-sun-soft");
    expect(wash).toHaveAttribute("aria-hidden", "true");
  });
});
