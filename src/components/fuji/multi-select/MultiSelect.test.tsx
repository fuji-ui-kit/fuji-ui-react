import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MultiSelect } from "./MultiSelect";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("MultiSelect", () => {
  it("sets aria-invalid on the input when invalid, and omits it otherwise", () => {
    const { rerender } = render(<MultiSelect items={items} aria-label="Letters" invalid />);
    expect(screen.getByLabelText("Letters")).toHaveAttribute("aria-invalid", "true");

    rerender(<MultiSelect items={items} aria-label="Letters" />);
    expect(screen.getByLabelText("Letters")).not.toHaveAttribute("aria-invalid");
  });

  // Regression: the chevron toggle is a raw <button> with no border/background
  // of its own, so without Tailwind preflight it fell back to native OS
  // button chrome (grey background, outset border) instead of a plain icon.
  it("resets native button chrome on the toggle button", () => {
    render(<MultiSelect items={items} aria-label="Letters" />);
    const toggle = screen.getByRole("button", { name: "Toggle options" });
    expect(toggle.className).toEqual(expect.stringContaining("border-0"));
    expect(toggle.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(toggle.className).toEqual(expect.stringContaining("appearance-none"));
  });
});
