import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimePicker } from "./TimePicker";
import { FormField } from "../form-field";

describe("TimePicker", () => {
  it("sets aria-invalid on the trigger when invalid, and omits it otherwise", () => {
    const { rerender } = render(<TimePicker aria-label="Time" invalid />);
    expect(screen.getByLabelText("Time")).toHaveAttribute("aria-invalid", "true");

    rerender(<TimePicker aria-label="Time" />);
    expect(screen.getByLabelText("Time")).not.toHaveAttribute("aria-invalid");
  });

  // Regression: like DatePicker, the trigger was invisible to Base UI Field,
  // so a FormField label named nothing and `<FormField invalid>` never showed.
  it("is labelled by and inherits invalid state from an ancestor FormField", () => {
    render(
      <FormField invalid>
        <FormField.Label>Start time</FormField.Label>
        <TimePicker defaultValue="09:30" />
      </FormField>,
    );
    const trigger = screen.getByRole("button", { name: "Start time" });
    expect(screen.getByText("Start time")).toHaveAttribute("for", trigger.id);
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("data-invalid", "");
  });

  it("accepts aria-labelledby", () => {
    render(
      <>
        <span id="t-label">Alarm</span>
        <TimePicker aria-labelledby="t-label" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Alarm" })).toBeInTheDocument();
  });
});
