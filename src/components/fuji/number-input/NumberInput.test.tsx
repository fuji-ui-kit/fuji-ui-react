import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { NumberInput } from "./NumberInput";
import { FormField } from "../form-field";

/**
 * Tailwind's `x:utility` variant compiles to the CSS pseudo-class `&:x`, and
 * its `x-[y]:utility` form compiles to the attribute selector `&[y]` (e.g.
 * `data-[disabled]:opacity-45` -> `[data-disabled] { opacity: .45 }`). Both
 * are real CSS the browser (and jsdom) evaluates against the live element -
 * not something this test invents. Pull every disabled-dimming utility class
 * actually shipped on `el` and ask the DOM whether the selector it compiles
 * to matches `el` as currently rendered. This fails whenever the shipped
 * variant can never match the element's real state (e.g. `disabled:` on a
 * `<div role="group">`, which can never satisfy `:disabled`), instead of
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

  // Regression (Defect 1): the visible box is `NumberField.Group`, a
  // `<div role="group">` wrapper around the real input/buttons - not a form
  // control itself. It shares `fieldSurface()` with Input/NativeSelect/etc.,
  // whose `disabled:` pseudo-class can only ever fire on a genuine `:disabled`
  // element. Measured before the fix: the two spinner `<button disabled>`s
  // dimmed correctly (real `:disabled`), but the group around them kept a
  // full-strength border/background - "an active box containing dim
  // buttons". Fails before the `data-[disabled]:` fix in field-surface.ts;
  // passes after.
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

  // Regression (Defect 2): the group used to write
  // `data-invalid={invalid ? "" : undefined}` itself. Passing an explicit
  // `undefined` still occupies the prop key, so it won the merge in Base
  // UI's `useRenderElement` over the `data-invalid` that `NumberField.Group`
  // already computes automatically from an ancestor `<FormField invalid>` -
  // erasing it whenever NumberInput's own `invalid` prop was left unset (the
  // common case: the border was supposed to come from the surrounding
  // FormField). Fails before the fix (no `data-invalid` on the group, so the
  // `data-[invalid]:border-fuji-fire` border never painted); passes after.
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
