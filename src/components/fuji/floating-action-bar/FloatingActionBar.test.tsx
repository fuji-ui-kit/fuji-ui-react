import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { FloatingActionBar } from "./FloatingActionBar";

const ACTIONS = [
  { icon: <span />, label: "Share" },
  { icon: <span />, label: "Duplicate" },
  { icon: <span />, label: "Delete", destructive: true },
];

describe("FloatingActionBar", () => {
  it("starts collapsed and hides its actions from assistive tech", () => {
    render(<FloatingActionBar actions={ACTIONS} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // The actions stay mounted so the width can animate, so "hidden" has to
    // mean hidden from the tree - not absent from the DOM.
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("expands on click and exposes its actions", async () => {
    const user = userEvent.setup();
    render(<FloatingActionBar actions={ACTIONS} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("runs an action and collapses", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<FloatingActionBar actions={[{ icon: <span />, label: "Share", onSelect }]} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<FloatingActionBar actions={ACTIONS} defaultOpen />);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("supports being controlled", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<FloatingActionBar actions={ACTIONS} open={false} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled: it must not move on its own.
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the actions out of layout flow so the trigger cannot move", () => {
    render(<FloatingActionBar actions={ACTIONS} defaultOpen />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    const column = trigger.nextElementSibling as HTMLElement;
    // Absolutely positioned open or closed. As a flex sibling, opening grew
    // the container and shoved the trigger across the page.
    expect(column.className).toContain("absolute");
  });

  it("honours an explicit direction", () => {
    const { rerender } = render(<FloatingActionBar actions={ACTIONS} direction="down" defaultOpen />);
    expect(screen.getByRole("button", { name: "Actions" }).closest("[data-side]")).toHaveAttribute(
      "data-side",
      "down",
    );
    rerender(<FloatingActionBar actions={ACTIONS} direction="up" defaultOpen />);
    expect(screen.getByRole("button", { name: "Actions" }).closest("[data-side]")).toHaveAttribute(
      "data-side",
      "up",
    );
  });

  it("resolves direction from available space when auto", async () => {
    const user = userEvent.setup();
    // jsdom reports a zero rect, so `top` is 0 - no room above, plenty below.
    render(<FloatingActionBar actions={ACTIONS} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);
    expect(trigger.closest("[data-side]")).toHaveAttribute("data-side", "down");
  });

  it("has no obvious accessibility violations when open", async () => {
    const { container } = render(<FloatingActionBar actions={ACTIONS} defaultOpen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
