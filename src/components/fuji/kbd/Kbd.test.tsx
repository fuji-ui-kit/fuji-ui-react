import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders a kbd element carrying the shared chip surface", () => {
    render(<Kbd data-testid="chip">⌘K</Kbd>);
    const chip = screen.getByTestId("chip");
    expect(chip.tagName).toBe("KBD");
    expect(chip).toHaveClass("fuji-kbd-surface");
    expect(chip).toHaveTextContent("⌘K");
  });

  it("colors the border and text per tone, leaving the surface neutral", () => {
    render(
      <Kbd tone="water" data-testid="chip">
        W
      </Kbd>,
    );
    const chip = screen.getByTestId("chip");
    expect(chip.className).toContain("border-fuji-water");
    expect(chip.className).toContain("text-fuji-water");
    expect(chip).toHaveClass("fuji-kbd-surface");
  });

  it("defaults to the inline `sm` chip and scales with `size`", () => {
    const { rerender } = render(<Kbd data-testid="chip">A</Kbd>);
    expect(screen.getByTestId("chip").className).toContain("--fuji-text-xs");

    rerender(
      <Kbd size="md" data-testid="chip">
        A
      </Kbd>,
    );
    expect(screen.getByTestId("chip").className).toContain("--fuji-text-sm");

    rerender(
      <Kbd size="lg" data-testid="chip">
        A
      </Kbd>,
    );
    expect(screen.getByTestId("chip").className).toContain("--fuji-text-base");
  });

  it("forwards its ref and spreads native props", () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Kbd ref={ref} className="mine" title="Command K" data-testid="chip">
        ⌘K
      </Kbd>,
    );
    const chip = screen.getByTestId("chip");
    expect(ref.current).toBe(chip);
    expect(chip).toHaveClass("mine");
    expect(chip).toHaveAttribute("title", "Command K");
  });
});
