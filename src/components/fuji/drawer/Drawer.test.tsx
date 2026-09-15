import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Drawer } from "./Drawer";

describe("Drawer", () => {
  it("opens from its trigger, supports a side, and closes on Escape with focus restored", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <Drawer.Trigger>Open menu</Drawer.Trigger>
        <Drawer.Content side="left">
          <Drawer.Title>Menu</Drawer.Title>
          <button>Item</button>
        </Drawer.Content>
      </Drawer>,
    );

    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);

    expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it.each([
    ["bottom", "fj:w-full"],
    ["top", "fj:w-full"],
  ] as const)("spans the edge on side=%s by default", async (side, expected) => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content side={side}>
          <Drawer.Title>Panel</Drawer.Title>
        </Drawer.Content>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const panel = await screen.findByRole("dialog", { name: "Panel" });
    expect(panel.className).toContain(expected);
    expect(panel).toHaveAttribute("data-variant", "full");
  });

  it("insets and caps the panel under variant=sheet", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content side="bottom" variant="sheet">
          <Drawer.Title>Share</Drawer.Title>
        </Drawer.Content>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const panel = await screen.findByRole("dialog", { name: "Share" });
    // The detached card: capped width, a margin off the edge, rounded all
    // round rather than squared off against the viewport.
    expect(panel.className).toContain("fj:max-w-lg");
    expect(panel.className).toContain("fj:mb-3");
    expect(panel).toHaveAttribute("data-variant", "sheet");
  });
});
