import * as React from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "./Popover";

// jsdom has no DOMMatrixReadOnly, which the positioner's transform-flattening
// hook reads once Base UI positions the panel. Only the translation matters
// here, and jsdom lays nothing out, so a zero offset is the honest stand-in.
beforeAll(() => {
  vi.stubGlobal(
    "DOMMatrixReadOnly",
    class {
      m41 = 0;
      m42 = 0;
    },
  );
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe("Popover", () => {
  it("forwards side and align to the positioner rather than dropping them on the popup", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <Popover.Trigger>Share</Popover.Trigger>
        <Popover.Content side="left" align="end" alignOffset={4} sideOffset={12} data-testid="panel">
          <Popover.Title>Share this page</Popover.Title>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Share" }));
    const panel = await screen.findByTestId("panel");
    // Base UI stamps the resolved placement on both the positioner and the
    // popup; spread onto the popup these props were never read at all.
    expect(panel).toHaveAttribute("data-side", "left");
    expect(panel).toHaveAttribute("data-align", "end");
    expect(panel.parentElement).toHaveAttribute("data-side", "left");
    // Nor do they leak onto the DOM as unknown attributes.
    expect(panel).not.toHaveAttribute("side");
    expect(panel).not.toHaveAttribute("alignoffset");
  });

  it("keeps Base UI's bottom/center placement when none is given", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <Popover.Trigger>Share</Popover.Trigger>
        <Popover.Content data-testid="panel">
          <Popover.Title>Share this page</Popover.Title>
        </Popover.Content>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Share" }));
    const panel = await screen.findByTestId("panel");
    expect(panel).toHaveAttribute("data-side", "bottom");
    expect(panel).toHaveAttribute("data-align", "center");
  });
});
