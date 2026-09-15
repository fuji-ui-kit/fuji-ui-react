import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Switch } from "./Switch";

/**
 * Tailwind's `x:utility` variant compiles to the CSS pseudo-class `&:x`, and
 * its `x-[y]:utility` form compiles to the attribute selector `&[y]` (e.g.
 * `data-[disabled]:opacity-45` -> `[data-disabled] { opacity: .45 }`). Both
 * are real CSS the browser (and jsdom) evaluates against the live element -
 * not something this test invents. Pull every disabled-dimming utility class
 * actually shipped on `el` and ask the DOM whether the selector it compiles
 * to matches `el` as currently rendered. This fails whenever the shipped
 * variant can never match the element's real state (e.g. `disabled:` on a
 * `<span role="switch">`, which can never satisfy `:disabled`), instead of
 * merely checking that some class string is present.
 */
function disabledStylingApplies(el: Element): boolean {
  const relevant = el.className
    .split(/\s+/)
    .filter((c) => /^fj:.+:(opacity-\d+|cursor-not-allowed|pointer-events-none)$/.test(c));
  if (relevant.length === 0) return false;
  return relevant.every((c) => {
    const withoutPrefix = c.slice(3); // strip the "fj:" scoping prefix
    const variant = withoutPrefix.slice(0, withoutPrefix.lastIndexOf(":"));
    const bracketed = /^data-\[(.+)\]$/.exec(variant);
    const selector = bracketed ? `[data-${bracketed[1]}]` : `:${variant}`;
    return el.matches(selector);
  });
}

describe("Switch", () => {
  it("toggles on click, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    const control = screen.getByRole("switch", { name: "Notifications" });
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("toggles by clicking its associated label text", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    await user.click(screen.getByText("Notifications"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles via the keyboard", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    await user.tab();
    expect(screen.getByRole("switch")).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("reports changes when controlled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch label="Notifications" checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" disabled />);

    const control = screen.getByRole("switch");
    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    // Base UI's Switch.Root renders a non-native element (role="switch"),
    // not a real <button>, so disabled state is ARIA-driven rather than the
    // native `disabled` DOM property.
    expect(control).toHaveAttribute("aria-disabled", "true");
  });

  // Regression: same root cause as Checkbox - the `disabled:` pseudo-class
  // variant this track used to ship can never match a `<span role="switch">`,
  // so a disabled Switch rendered pixel-identical to an active one. Fails
  // before the `data-[disabled]:` fix; passes after.
  it("actually applies the disabled-dimming styling to the track (not just the data attribute)", () => {
    render(<Switch label="Notifications" disabled />);
    const control = screen.getByRole("switch");
    expect(control).toHaveAttribute("data-disabled", "");
    expect(disabledStylingApplies(control)).toBe(true);
  });

  it("renders without a label as just the control", () => {
    render(<Switch aria-label="Airplane mode" />);
    expect(screen.getByRole("switch", { name: "Airplane mode" })).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    // The declared ref type is HTMLButtonElement, but Base UI's Switch.Root
    // actually renders a non-native role="switch" element (see the linked
    // follow-up on this type mismatch) - compare structurally rather than
    // via `instanceof HTMLButtonElement`, which would fail at runtime.
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch aria-label="Airplane mode" ref={ref} />);
    expect(ref.current as unknown as HTMLElement).toBe(screen.getByRole("switch"));
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Switch label="Notifications" tone="forest" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
