import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Check } from "lucide-react";
import { Icon } from "./Icon";

/** A hand-written SVG component - not from Lucide - to prove Icon isn't pinned to LucideIcon. */
function CustomGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx={12} cy={12} r={10} />
    </svg>
  );
}

describe("Icon", () => {
  it("is decorative (aria-hidden) by default", () => {
    const { container } = render(<Icon icon={Check} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes an accessible name when a label is provided", () => {
    render(<Icon icon={Check} label="Completed" />);
    expect(screen.getByRole("img", { name: "Completed" })).toBeInTheDocument();
  });

  it("accepts a non-Lucide SVG component compatible with the same props shape", () => {
    render(<Icon icon={CustomGlyph} label="Custom" />);
    expect(screen.getByRole("img", { name: "Custom" })).toBeInTheDocument();
  });

  it("has no obvious accessibility violations with a background and label", async () => {
    const { container } = render(<Icon icon={Check} label="Done" background="solid" tone="forest" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
