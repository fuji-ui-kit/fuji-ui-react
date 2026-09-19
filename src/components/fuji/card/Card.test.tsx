import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its compound parts together", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Plan</Card.Title>
          <Card.Description>Monthly billing</Card.Description>
        </Card.Header>
        <Card.Content>Details go here.</Card.Content>
        <Card.Footer>
          <button type="button">Upgrade</button>
        </Card.Footer>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByText("Monthly billing")).toBeInTheDocument();
    expect(screen.getByText("Details go here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
  });

  it("renders CardTitle as an h3 by default and honors the `as` override", () => {
    const { rerender } = render(<Card.Title>Default heading</Card.Title>);
    expect(screen.getByText("Default heading").tagName).toBe("H3");

    rerender(<Card.Title as="h1">Top-level heading</Card.Title>);
    expect(screen.getByText("Top-level heading").tagName).toBe("H1");
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("spreads native props and merges className", () => {
    render(
      <Card data-testid="card" className="custom-class">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("custom-class");
  });

  it('applies the lift treatment for effect="lift" and not by default', () => {
    const { rerender } = render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card").className).not.toContain("hover:scale-105");

    rerender(
      <Card data-testid="card" effect="lift">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("motion-safe:hover:scale-105");
  });

  it("still honours the deprecated `interactive` prop, with `effect` winning", () => {
    const { rerender } = render(
      <Card data-testid="card" interactive>
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("hover:scale-105");

    // An explicit `effect` overrides the legacy boolean, so `effect="none"` opts back out.
    rerender(
      <Card data-testid="card" interactive effect="none">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).not.toContain("hover:scale-105");
  });

  it("transitions the properties the hover treatment actually changes", () => {
    render(
      <Card data-testid="card" effect="lift">
        Content
      </Card>,
    );
    // Tailwind v4 emits `scale`/`rotate` as their own properties, not `transform`.
    const classes = screen.getByTestId("card").className;
    expect(classes).toContain("transition-[background-color,border-color,box-shadow,transform,scale,rotate]");
    // Gated by `motion-safe`: a `motion-reduce` override loses on specificity to the `:hover` rule.
    expect(classes).toContain("motion-safe:hover:scale-105");
    expect(classes).toContain("motion-safe:hover:-rotate-1");
    expect(classes).not.toContain("motion-reduce:scale-100");
  });

  it("renders the tilt variant and forwards its ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Card data-testid="card" effect="tilt" ref={ref}>
        Content
      </Card>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    // The tilt is driven from JS, so it must not carry the CSS lift classes.
    expect(screen.getByTestId("card").className).not.toContain("hover:scale-105");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <Card effect="lift">
        <Card.Header>
          <Card.Title>Plan</Card.Title>
          <Card.Description>Monthly billing</Card.Description>
        </Card.Header>
        <Card.Content>Details go here.</Card.Content>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("padding", () => {
    it("defaults to md - the original 20px", () => {
      render(<Card data-testid="card">Body</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("fj:p-[var(--fuji-card-padding)]", "fj:[--fuji-card-padding:1.25rem]");
    });

    it.each([
      ["none", "fj:[--fuji-card-padding:0px]"],
      ["sm", "fj:[--fuji-card-padding:0.75rem]"],
      ["lg", "fj:[--fuji-card-padding:1.5rem]"],
    ] as const)("sets padding=%s", (padding, expected) => {
      render(
        <Card data-testid="card" padding={padding}>
          Body
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(expected);
      // Exactly one padding value - tailwind-merge drops nothing it shouldn't.
      expect(card.className.match(/--fuji-card-padding:/g)).toHaveLength(1);
    });

    it("keeps Card.Media flush by cancelling the card's own padding variable", () => {
      render(
        <Card padding="sm">
          <Card.Media data-testid="media">
            <img src="photo.jpg" alt="" />
          </Card.Media>
        </Card>,
      );
      const media = screen.getByTestId("media");
      expect(media).toHaveClass(
        "fj:-mx-[var(--fuji-card-padding,1.25rem)]",
        "fj:-mt-[var(--fuji-card-padding,1.25rem)]",
      );
    });

    it("keeps the padding prop off the DOM, including with effect=tilt", () => {
      render(
        <Card data-testid="card" padding="none" effect="tilt">
          Body
        </Card>,
      );
      expect(screen.getByTestId("card")).not.toHaveAttribute("padding");
      expect(screen.getByTestId("card")).toHaveClass("fj:[--fuji-card-padding:0px]");
    });
  });
});
