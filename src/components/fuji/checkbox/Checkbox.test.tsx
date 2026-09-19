import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Checkbox } from "./Checkbox";

/**
 * Whether the disabled-dimming classes shipped on `el` compile to selectors that match it in the
 * DOM, so a variant that never can (`disabled:` on a `<span role="checkbox">`) fails.
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

describe("Checkbox", () => {
  it("toggles on click, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" />);

    const control = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("reports changes when controlled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" disabled />);

    const control = screen.getByRole("checkbox");
    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).toHaveAttribute("data-disabled", "");
  });

  // Regression: Base.Root is a `<span role="checkbox">`, which never satisfies `:disabled`, so a
  // disabled checkbox looked identical to an active one despite `data-disabled` being present.
  it("actually applies the disabled-dimming styling to the box (not just the data attribute)", () => {
    render(<Checkbox label="Accept terms" disabled />);
    const control = screen.getByRole("checkbox");
    expect(control).toHaveAttribute("data-disabled", "");
    expect(disabledStylingApplies(control)).toBe(true);
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Checkbox label="Accept terms" tone="forest" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox aria-label="Accept terms" ref={ref} />);
    expect(ref.current as unknown as HTMLElement).toBe(screen.getByRole("checkbox"));
  });
});
