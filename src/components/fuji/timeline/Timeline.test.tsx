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

  describe("groups", () => {
    const groups = [
      {
        label: "2026",
        items: [
          { title: "Launch", timestamp: "Sep 14" },
          { title: "Beta", timestamp: "9:41 AM" },
          { title: "Kickoff" },
        ],
      },
      { label: "2025", items: [{ title: "Idea" }] },
    ];

    // A fixed `w-8` truncated/overflowed anything wider than a two-digit year.
    it("sizes the timestamp column to its content instead of a fixed width", () => {
      render(<Timeline groups={groups} />);
      const stamp = screen.getByText("9:41 AM");
      expect(stamp.className).not.toMatch(/(^|\s)fj:w-8(\s|$)/);
      expect(stamp).toHaveClass("fj:min-w-8", "fj:whitespace-nowrap");
      // Rows share one auto-sized column through subgrid, so titles stay aligned.
      const list = stamp.closest("li")!.parentElement!;
      expect(list.className).toContain("fj:grid-cols-[auto_minmax(0,1fr)]");
      expect(stamp.closest("li")).toHaveClass("fj:grid-cols-subgrid");
    });

    it("keeps an item without a timestamp aligned with its group's titles", () => {
      render(<Timeline groups={groups} />);
      const row = screen.getByText("Kickoff").closest("li")!;
      // An empty column cell holds the title in the second column.
      expect(row.children).toHaveLength(2);
      expect(row.children[0]).toBeEmptyDOMElement();
    });

    it("skips the timestamp column for a group with no timestamps", () => {
      render(<Timeline groups={groups} />);
      const row = screen.getByText("Idea").closest("li")!;
      expect(row.children).toHaveLength(1);
      expect(row.parentElement!.className).not.toContain("fj:grid");
    });

    it("has no obvious accessibility violations", async () => {
      const { container } = render(<Timeline groups={groups} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
