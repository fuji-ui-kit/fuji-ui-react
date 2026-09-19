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

  // Regression: the chevron is a raw <button>; without preflight it got native OS button chrome.
  it("resets native button chrome on the toggle button", () => {
    render(<Combobox items={items} aria-label="Letter" />);
    const toggle = screen.getByRole("button", { name: "Toggle options" });
    expect(toggle.className).toEqual(expect.stringContaining("border-0"));
    expect(toggle.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(toggle.className).toEqual(expect.stringContaining("appearance-none"));
  });

  // Regression: an explicit `data-invalid={undefined}` on `Base.InputGroup` (which carries the
  // invalid border) won the merge and erased the value Base UI computes from `<FormField invalid>`.
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
