import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it.each([
    ["sm", "fj:min-h-20"],
    ["md", "fj:min-h-24"],
    ["lg", "fj:min-h-32"],
  ] as const)("gives size=%s its minimum height when rows is not set", (size, floor) => {
    render(<Textarea aria-label="Notes" size={size} />);
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveClass(floor);
  });

  it("drops the size's minimum height when rows is given, so rows={1} is one line", () => {
    // `min-height` beats the height `rows` produces, so with the floor always
    // on a one-line composer still drew a 96px box.
    render(<Textarea aria-label="Message" rows={1} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea).toHaveAttribute("rows", "1");
    expect(textarea.className).not.toMatch(/fj:min-h-/);
    // Padding and type scale still follow `size`.
    expect(textarea).toHaveClass("fj:px-3", "fj:py-2.5");
  });

  it("forwards rows to the DOM on every size", () => {
    render(<Textarea aria-label="Notes" size="lg" rows={6} />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).not.toHaveClass("fj:min-h-32");
  });
});
