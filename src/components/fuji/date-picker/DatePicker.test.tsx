import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatePicker } from "./DatePicker";

describe("DatePicker", () => {
  it("sets aria-invalid on the trigger when invalid, and omits it otherwise", () => {
    const { rerender } = render(<DatePicker aria-label="Date" invalid />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("aria-invalid", "true");

    rerender(<DatePicker aria-label="Date" />);
    expect(screen.getByLabelText("Date")).not.toHaveAttribute("aria-invalid");
  });
});
