import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("renders a safe href on an item", () => {
    render(<Navbar items={[{ label: "Docs", href: "/docs" }]} />);
    const anchor = screen.getByText("Docs").closest("a");
    expect(anchor).toHaveAttribute("href", "/docs");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<Navbar items={[{ label: "Docs", href: "javascript:alert(1)" }]} />);
    const anchor = screen.getByText("Docs").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });

  it("renders a button and calls onItemSelect when an item has no href", async () => {
    const onItemSelect = vi.fn();
    const user = userEvent.setup();
    render(<Navbar items={[{ label: "Settings" }]} onItemSelect={onItemSelect} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(onItemSelect).toHaveBeenCalledWith({ label: "Settings" }, 0);
  });
});
