import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("toggles on click, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    const control = screen.getByRole("switch", { name: "Notifications" });
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("toggles by clicking its associated label text", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    await user.click(screen.getByText("Notifications"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles via the keyboard", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);

    await user.tab();
    expect(screen.getByRole("switch")).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("reports changes when controlled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch label="Notifications" checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" disabled />);

    const control = screen.getByRole("switch");
    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    // Base UI's Switch.Root renders a non-native element (role="switch"),
    // not a real <button>, so disabled state is ARIA-driven rather than the
    // native `disabled` DOM property.
    expect(control).toHaveAttribute("aria-disabled", "true");
  });

  it("renders without a label as just the control", () => {
    render(<Switch aria-label="Airplane mode" />);
    expect(screen.getByRole("switch", { name: "Airplane mode" })).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    // The declared ref type is HTMLButtonElement, but Base UI's Switch.Root
    // actually renders a non-native role="switch" element (see the linked
    // follow-up on this type mismatch) - compare structurally rather than
    // via `instanceof HTMLButtonElement`, which would fail at runtime.
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch aria-label="Airplane mode" ref={ref} />);
    expect(ref.current as unknown as HTMLElement).toBe(screen.getByRole("switch"));
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Switch label="Notifications" tone="forest" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
