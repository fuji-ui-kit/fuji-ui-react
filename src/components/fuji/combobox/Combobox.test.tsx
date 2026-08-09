import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Combobox } from "./Combobox";

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
});
