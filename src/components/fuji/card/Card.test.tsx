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

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <Card interactive>
        <Card.Header>
          <Card.Title>Plan</Card.Title>
          <Card.Description>Monthly billing</Card.Description>
        </Card.Header>
        <Card.Content>Details go here.</Card.Content>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
