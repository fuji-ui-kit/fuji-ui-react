import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { NumberInput } from "./NumberInput";
import { FormField } from "../form-field";

/**
 * Compiles each disabled-dimming class on `el` to its real selector and asks the DOM if it
 * matches, so a variant that can never fire (e.g. `disabled:` on a `<div role="group">`) fails.
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

describe("NumberInput", () => {
  it("increments and decrements via the spinner buttons", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={1} />);

    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");

    await user.click(screen.getByRole("button", { name: "Decrease value" }));
    await user.click(screen.getByRole("button", { name: "Decrease value" }));
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("0");
  });

  it("disables the spinner buttons and the input", () => {
    render(<NumberInput aria-label="Quantity" disabled />);
    expect(screen.getByRole("button", { name: "Increase value" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease value" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Quantity" })).toBeDisabled();
  });

  // Regression (Defect 1): the box is `NumberField.Group`, a `<div role="group">` that can't match
  // `fieldSurface()`'s `disabled:`, so it kept full-strength styling around dimmed buttons. Guards
  // the `data-[disabled]:` fix in field-surface.ts.
  it("actually applies the disabled-dimming styling to the group wrapper (not just the data attribute)", () => {
    render(<NumberInput aria-label="Quantity" disabled />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-disabled", "");
    expect(disabledStylingApplies(group)).toBe(true);
  });

  it("sets data-invalid on the group when its own invalid prop is set, and omits it otherwise", () => {
    const { rerender } = render(<NumberInput aria-label="Quantity" invalid />);
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");

    rerender(<NumberInput aria-label="Quantity" />);
    expect(screen.getByRole("group")).not.toHaveAttribute("data-invalid");
  });

  // Regression (Defect 2): an explicit `data-invalid={undefined}` won the merge and erased the
  // value the group derives from an ancestor `<FormField invalid>`, so the
  // `data-[invalid]:border-fuji-fire` border never painted when `invalid` was unset.
  it("picks up data-invalid from an ancestor FormField without its own invalid prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Quantity</FormField.Label>
        <NumberInput aria-label="Quantity" />
      </FormField>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<NumberInput aria-label="Quantity" defaultValue={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<NumberInput aria-label="Quantity" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
