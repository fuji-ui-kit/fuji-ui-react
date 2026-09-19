import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";

describe("IconButton", () => {
  it("renders as a real button and forwards a ref", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="Close">
        <X />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
  });

  it("fires onClick when enabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton aria-label="Close" onClick={onClick}>
        <X />
      </IconButton>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables interaction while loading", () => {
    render(
      <IconButton aria-label="Close" loading>
        <X />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  // Regression: focus-visible outline classes lived only in Button.tsx's JSX, so IconButton fell
  // back to the native ring (~2:1, under the 3:1 non-text minimum). They now live in the recipe.
  it("carries the shared focus-visible outline styling", () => {
    render(
      <IconButton aria-label="Close">
        <X />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button.className).toEqual(expect.stringContaining("focus-visible:outline-2"));
    expect(button.className).toEqual(expect.stringContaining("focus-visible:outline-offset-2"));
    expect(button.className).toEqual(expect.stringContaining("focus-visible:outline-fuji-focus-ring"));
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <X />
      </IconButton>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
