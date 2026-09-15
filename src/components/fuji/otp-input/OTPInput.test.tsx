import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OTPInput } from "./OTPInput";
import { FormField } from "../form-field";

describe("OTPInput", () => {
  it("renders one input per digit of length", () => {
    render(<OTPInput length={4} aria-label="One-time code" />);
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("sets data-invalid on the group when its own invalid prop is set, and omits it otherwise", () => {
    const { rerender } = render(<OTPInput length={4} aria-label="One-time code" invalid />);
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");

    rerender(<OTPInput length={4} aria-label="One-time code" />);
    expect(screen.getByRole("group")).not.toHaveAttribute("data-invalid");
  });

  // Gap 2: `OTPField.Root` calls Base UI's Field context hook itself and
  // registers as the field control (confirmed by reading Base UI's source),
  // so it mirrors an ancestor `<FormField invalid>` onto itself as
  // `data-invalid` the same way `Field.Control` does elsewhere - but the
  // group wrote `data-invalid={invalid ? "" : undefined}`, an explicit
  // `undefined`-valued prop that still occupies the key and wins the merge
  // in Base UI's `useRenderElement` over that computed value, erasing it
  // whenever OTPInput's own `invalid` prop was left unset (the common case:
  // the group's invalid state was supposed to come from the surrounding
  // FormField). Fails before the fix (no `data-invalid` on the group);
  // passes after.
  it("picks up data-invalid on the group from an ancestor FormField without its own invalid prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>One-time code</FormField.Label>
        <OTPInput length={4} />
      </FormField>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");
  });
});
