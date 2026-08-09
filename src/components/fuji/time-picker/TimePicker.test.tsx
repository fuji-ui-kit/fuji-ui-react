import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimePicker } from "./TimePicker";

describe("TimePicker", () => {
  it("sets aria-invalid on the trigger when invalid, and omits it otherwise", () => {
    const { rerender } = render(<TimePicker aria-label="Time" invalid />);
    expect(screen.getByLabelText("Time")).toHaveAttribute("aria-invalid", "true");

    rerender(<TimePicker aria-label="Time" />);
    expect(screen.getByLabelText("Time")).not.toHaveAttribute("aria-invalid");
  });
});
