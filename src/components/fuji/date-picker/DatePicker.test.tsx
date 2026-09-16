import * as React from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { DatePicker } from "./DatePicker";
import { FormField } from "../form-field";

// jsdom has no DOMMatrixReadOnly, which the popover positioner reads once the
// panel opens (see Popover.test.tsx for the same stand-in).
beforeAll(() => {
  vi.stubGlobal(
    "DOMMatrixReadOnly",
    class {
      m41 = 0;
      m42 = 0;
    },
  );
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe("DatePicker", () => {
  it("sets aria-invalid on the trigger when invalid, and omits it otherwise", () => {
    const { rerender } = render(<DatePicker aria-label="Date" invalid />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("aria-invalid", "true");

    rerender(<DatePicker aria-label="Date" />);
    expect(screen.getByLabelText("Date")).not.toHaveAttribute("aria-invalid");
  });

  // Regression: the trigger was a bare Popover.Trigger, invisible to Base UI
  // Field - `<FormField invalid>` never reached it (no red border, no
  // aria-invalid) and the label's `for` pointed at an id nothing rendered.
  it("picks up an ancestor FormField's invalid state without its own prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Due date</FormField.Label>
        <DatePicker />
      </FormField>,
    );
    const trigger = screen.getByRole("button", { name: "Due date" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("data-invalid", "");
  });

  it("is labelled and described by its FormField", () => {
    render(
      <FormField>
        <FormField.Label>Due date</FormField.Label>
        <DatePicker />
        <FormField.Description>When the task is due.</FormField.Description>
      </FormField>,
    );
    const trigger = screen.getByRole("button", { name: "Due date" });
    const label = screen.getByText("Due date");
    expect(label).toHaveAttribute("for", trigger.id);
    expect(trigger).toHaveAttribute("aria-labelledby", label.id);
    expect(trigger).toHaveAccessibleDescription("When the task is due.");
  });

  it("lets an explicit aria-label win outside a FormField", () => {
    render(<DatePicker aria-label="Start" />);
    expect(screen.getByRole("button", { name: "Start" })).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps today selectable with minDate={new Date()}-style values that carry a time", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker aria-label="Date" today={new Date(2024, 4, 15)} minDate={new Date(2024, 4, 15, 16, 20)} />,
    );
    await user.click(screen.getByRole("button", { name: "Date" }));
    expect(await screen.findByRole("gridcell", { name: "Wednesday, May 15, 2024" })).toBeEnabled();
    expect(screen.getByRole("gridcell", { name: "Wednesday, May 15, 2024" })).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByRole("gridcell", { name: "Tuesday, May 14, 2024" })).toBeDisabled();
  });

  it("has no axe violations inside an invalid FormField", async () => {
    const { container } = render(
      <FormField invalid>
        <FormField.Label>Due date</FormField.Label>
        <DatePicker defaultValue={new Date(2024, 4, 15)} />
        <FormField.Error>Pick a date.</FormField.Error>
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
