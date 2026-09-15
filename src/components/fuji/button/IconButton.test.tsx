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

  // Regression (Defect 3): `Button.tsx` used to hardcode the focus-visible
  // outline classes directly in its own JSX rather than in the shared
  // `button.styles.ts` recipe, so `IconButton` - built from `iconButtonBase()`
  // in the same module - never got them and fell back to the browser's
  // native focus ring (measured at ~2:1 contrast against the light page,
  // under the 3:1 non-text minimum). The outline classes now live in
  // `button.styles.ts` itself so both Button and IconButton (and anything
  // else built from these recipes) get them for free and can't drift apart
  // again. Fails before the fix (no focus-visible/outline classes anywhere
  // in the rendered className); passes after.
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
