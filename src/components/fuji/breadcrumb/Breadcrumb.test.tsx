import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("renders a safe href on a non-last item", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Docs" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).toHaveAttribute("href", "/");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "javascript:alert(1)" }, { label: "Docs" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });
});
