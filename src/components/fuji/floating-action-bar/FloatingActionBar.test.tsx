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

  // A root `relative` fought `className="fixed bottom-6 right-6"` - which
  // `position` won depended on stylesheet order.
  it("leaves the root unpositioned so a consumer's positioning class applies", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<FloatingActionBar ref={ref} actions={ACTIONS} className="fixed right-6 bottom-6" />);
    const root = ref.current!;
    expect(root).toHaveClass("fixed", "right-6", "bottom-6");
    expect(root.className).not.toMatch(/fj:(relative|absolute|fixed|sticky|static)\b/);
    // The column still has a positioned anchor - an inner wrapper around the trigger.
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger.parentElement).not.toBe(root);
    expect(trigger.parentElement).toHaveClass("fj:relative");
  });

  it("marks the column's parent open, which the open animation keys off", () => {
    render(<FloatingActionBar actions={ACTIONS} defaultOpen />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    const action = trigger.nextElementSibling!.firstElementChild!;
    expect(action).toHaveClass("fuji-fab-action");
    // base.css: `[data-open] > * > .fuji-fab-action`.
    expect(action.parentElement!.parentElement).toHaveAttribute("data-open");
  });

  it("renders actions that share a label without React key warnings", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    render(
      <FloatingActionBar
        actions={[
          { icon: <span />, label: "Share", onSelect: onFirst },
          { icon: <span />, label: "Share", onSelect: onSecond },
        ]}
        defaultOpen
      />,
    );
    expect(error.mock.calls.some((call) => String(call[0]).includes("same key"))).toBe(false);
    const buttons = screen.getAllByRole("button", { name: "Share" });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onFirst).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("uses an action's id as its key when given", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <FloatingActionBar
        actions={[
          { id: "a", icon: <span />, label: "Share" },
          { id: "b", icon: <span />, label: "Share" },
        ]}
        defaultOpen
      />,
    );
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
