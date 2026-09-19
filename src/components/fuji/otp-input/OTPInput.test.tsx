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

  // Gap 2: `OTPField.Root` mirrors an ancestor `<FormField invalid>` as `data-invalid`, but the
  // group's explicit `data-invalid={undefined}` won the merge and erased it whenever OTPInput's
  // own `invalid` was unset.
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
