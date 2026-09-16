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

  async function openPanel(content: React.ReactElement) {
    const user = userEvent.setup();
    render(
      <Drawer>
        <Drawer.Trigger>Open</Drawer.Trigger>
        {content}
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    return screen.findByRole("dialog", { name: "Panel" });
  }

  it.each(["left", "right", "top", "bottom"] as const)("scrolls its own content on side=%s", async (side) => {
    const panel = await openPanel(
      <Drawer.Content side={side}>
        <Drawer.Title>Panel</Drawer.Title>
      </Drawer.Content>,
    );
    expect(panel).toHaveClass("fj:overflow-y-auto", "fj:overscroll-contain");
  });

  it("keeps the 20rem side panel by default", async () => {
    const panel = await openPanel(
      <Drawer.Content side="right">
        <Drawer.Title>Panel</Drawer.Title>
      </Drawer.Content>,
    );
    expect(panel).toHaveClass("fj:w-80", "fj:max-w-[calc(100vw-3rem)]");
  });

  it.each([
    ["sm", "fj:w-64"],
    ["lg", "fj:w-[28rem]"],
    ["full", "fj:w-full"],
  ] as const)(
    "takes width=%s on a side panel, still capped short of the viewport",
    async (width, expected) => {
      const panel = await openPanel(
        <Drawer.Content side="left" variant="sheet" width={width}>
          <Drawer.Title>Panel</Drawer.Title>
        </Drawer.Content>,
      );
      expect(panel).toHaveClass(expected, "fj:max-w-[calc(100vw-3rem)]");
      expect(panel).not.toHaveClass("fj:w-80");
    },
  );

  it("ignores width on a top or bottom panel, which spans its edge", async () => {
    const panel = await openPanel(
      <Drawer.Content side="bottom" width="sm">
        <Drawer.Title>Panel</Drawer.Title>
      </Drawer.Content>,
    );
    expect(panel).toHaveClass("fj:w-full");
    expect(panel).not.toHaveClass("fj:w-64");
  });

  it("lets className override the width for a one-off panel", async () => {
    const panel = await openPanel(
      <Drawer.Content side="right" className="fj:w-[30rem]">
        <Drawer.Title>Panel</Drawer.Title>
      </Drawer.Content>,
    );
    expect(panel).toHaveClass("fj:w-[30rem]");
    expect(panel).not.toHaveClass("fj:w-80");
  });
});
