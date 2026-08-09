import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("exposes a status role with a default accessible label", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("accepts a custom accessible label", () => {
    render(<Spinner label="Fetching results" />);
    expect(screen.getByRole("status", { name: "Fetching results" })).toBeInTheDocument();
  });

  it("hides its decorative svg from assistive tech", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("spreads native props and merges className", () => {
    render(<Spinner data-testid="spinner" className="custom-class" />);
    expect(screen.getByTestId("spinner")).toHaveClass("custom-class");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Spinner label="Loading results" tone="forest" size="lg" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
