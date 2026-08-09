import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Timeline } from "./Timeline";

const items = [
  { title: "Order placed", timestamp: "9:00 AM", description: "Confirmation sent." },
  { title: "Shipped", timestamp: "2:30 PM", variant: "success" as const },
  { title: "Out for delivery", timestamp: "Pending", variant: "warning" as const },
];

describe("Timeline", () => {
  it("renders every item's content as a real ordered list", () => {
    render(<Timeline items={items} />);
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(items.length);
    expect(screen.getByText("Order placed")).toBeInTheDocument();
    expect(screen.getByText("Confirmation sent.")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
    expect(screen.getByText("9:00 AM")).toBeInTheDocument();
  });

  it("omits the description paragraph for items that don't have one", () => {
    render(<Timeline items={items} />);
    // "Shipped" has no description - only its title/timestamp row renders.
    expect(screen.getByText("Shipped").closest("li")?.querySelectorAll("p")).toHaveLength(1);
  });

  it("still renders every item's content in the alternating layout", () => {
    render(<Timeline items={items} layout="alternating" />);
    // Alternating renders each item's content twice (desktop grid cell +
    // mobile fallback row), so title text appears more than once per item.
    expect(screen.getAllByText("Order placed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Out for delivery").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(items.length);
  });

  it("forwards a ref to the root <ol>", () => {
    const ref = React.createRef<HTMLOListElement>();
    render(<Timeline items={items} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Timeline items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
