import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./Select";

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
});
