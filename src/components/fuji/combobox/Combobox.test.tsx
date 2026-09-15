import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Combobox } from "./Combobox";
import { FormField } from "../form-field";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Combobox", () => {
  it("sets aria-invalid on the input when invalid, and omits it otherwise", () => {
    const { rerender } = render(<Combobox items={items} aria-label="Letter" invalid />);
    expect(screen.getByLabelText("Letter")).toHaveAttribute("aria-invalid", "true");

    rerender(<Combobox items={items} aria-label="Letter" />);
    expect(screen.getByLabelText("Letter")).not.toHaveAttribute("aria-invalid");
  });

  // Regression: the chevron toggle is a raw <button> with no border/background
  // of its own, so without Tailwind preflight it fell back to native OS
  // button chrome (grey background, outset border) instead of a plain icon.
  it("resets native button chrome on the toggle button", () => {
    render(<Combobox items={items} aria-label="Letter" />);
    const toggle = screen.getByRole("button", { name: "Toggle options" });
    expect(toggle.className).toEqual(expect.stringContaining("border-0"));
    expect(toggle.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(toggle.className).toEqual(expect.stringContaining("appearance-none"));
  });

  // Regression (Defect 2): `Base.InputGroup` (the `<div role="group">` that
  // actually carries `data-[invalid]:border-fuji-fire`) suffered the same
  // stomping bug as the Field.Control-based inputs: an explicit
  // `data-invalid={invalid ? "" : undefined}` on the group won the merge
  // over the `data-invalid` Base UI computes from an ancestor `<FormField
  // invalid>`, erasing it whenever Combobox's own `invalid` prop was left
  // unset. Fails before the fix; passes after.
  it("propagates data-invalid from an ancestor FormField without its own invalid prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Letter</FormField.Label>
        <Combobox items={items} aria-label="Letter" />
      </FormField>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");
  });
});
