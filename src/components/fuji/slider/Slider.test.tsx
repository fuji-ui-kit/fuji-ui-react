import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Slider } from "./Slider";
import { FormField } from "../form-field";

describe("Slider", () => {
  // Regression: `aria-label` was spread onto the Root, naming only the
  // wrapping group - the focusable `role="slider"` input had no name.
  it("names the focusable thumb input with aria-label", () => {
    render(<Slider aria-label="Volume" defaultValue={40} />);
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("names the thumb with aria-labelledby", () => {
    render(
      <>
        <span id="vol-label">Volume</span>
        <Slider aria-labelledby="vol-label" defaultValue={40} />
      </>,
    );
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("names the thumb from its visible label", () => {
    render(<Slider label="Brightness" defaultValue={40} />);
    expect(screen.getByRole("slider", { name: "Brightness" })).toBeInTheDocument();
  });

  // Regression: a range value rendered a single thumb, so the second value
  // had no handle and no focusable control.
  it("renders one named thumb per range value, with per-thumb labels", () => {
    render(
      <Slider
        defaultValue={[20, 80]}
        getAriaLabel={(index) => (index === 0 ? "Minimum price" : "Maximum price")}
      />,
    );
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "Minimum price" })).toHaveValue("20");
    expect(screen.getByRole("slider", { name: "Maximum price" })).toHaveValue("80");
  });

  it("is labelled by an ancestor FormField", () => {
    render(
      <FormField>
        <FormField.Label>Opacity</FormField.Label>
        <Slider defaultValue={50} />
      </FormField>,
    );
    expect(screen.getByRole("slider", { name: "Opacity" })).toBeInTheDocument();
  });

  it("has no axe violations for an aria-labelled range", async () => {
    const { container } = render(<Slider aria-label="Price" defaultValue={[20, 80]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
