import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./Select";
import { FormField } from "../form-field";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Select", () => {
  it("sets aria-invalid on the trigger when invalid, and omits it otherwise", () => {
    const { rerender } = render(<Select items={items} aria-label="Letter" invalid />);
    expect(screen.getByLabelText("Letter")).toHaveAttribute("aria-invalid", "true");

    rerender(<Select items={items} aria-label="Letter" />);
    expect(screen.getByLabelText("Letter")).not.toHaveAttribute("aria-invalid");
  });

  // Regression (Defect 2): `Base.Trigger` is a real `<button>` that still reads Field context, so
  // an explicit `data-invalid={undefined}` erased the value derived from an ancestor
  // `<FormField invalid>` whenever Select's own `invalid` was unset.
  it("propagates data-invalid from an ancestor FormField without its own invalid prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Letter</FormField.Label>
        <Select items={items} aria-label="Letter" />
      </FormField>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-invalid", "");
  });
});
