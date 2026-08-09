import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNavigation } from "./BottomNavigation";

describe("BottomNavigation", () => {
  it("renders a safe href on an item", () => {
    render(<BottomNavigation items={[{ label: "Home", icon: <span />, href: "/" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).toHaveAttribute("href", "/");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<BottomNavigation items={[{ label: "Home", icon: <span />, href: "javascript:alert(1)" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });
});
