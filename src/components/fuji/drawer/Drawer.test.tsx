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
});
