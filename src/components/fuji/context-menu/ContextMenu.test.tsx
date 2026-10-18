import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { FujiProvider } from "../../../provider";
import { ContextMenu } from "./ContextMenu";

describe("ContextMenu", () => {
  it("opens on right-click (uncontrolled)", async () => {
    const handleSelect = vi.fn();

    render(
      <ContextMenu>
        <ContextMenu.Trigger data-testid="trigger">File target</ContextMenu.Trigger>
        <ContextMenu.Content data-testid="content">
          <ContextMenu.Item onClick={handleSelect}>Open file</ContextMenu.Item>
          <ContextMenu.Item>Share</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>,
    );

    expect(screen.queryByText("Open file")).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByTestId("trigger"), { clientX: 20, clientY: 40 });

    const item = await screen.findByRole("menuitem", { name: "Open file" });
    expect(item).toBeInTheDocument();

    await userEvent.click(item);
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("opens immediately when defaultOpen is true", async () => {
    render(
      <ContextMenu defaultOpen>
        <ContextMenu.Trigger>Target</ContextMenu.Trigger>
        <ContextMenu.Content data-testid="menu">
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>,
    );

    const item = await screen.findByRole("menuitem", { name: "Rename" });
    expect(item).toBeInTheDocument();
  });

  describe("controlled operation", () => {
    it("respects the controlled open prop", async () => {
      const { rerender } = render(
        <ContextMenu open={false}>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content data-testid="menu">
            <ContextMenu.Item>Download</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      expect(screen.queryByRole("menuitem", { name: "Download" })).not.toBeInTheDocument();

      rerender(
        <ContextMenu open={true}>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content data-testid="menu">
            <ContextMenu.Item>Download</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      expect(await screen.findByRole("menuitem", { name: "Download" })).toBeInTheDocument();
    });

    it("notifies onOpenChange when open state changes", async () => {
      const handleOpenChange = vi.fn();

      render(
        <ContextMenu onOpenChange={handleOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">Target</ContextMenu.Trigger>
          <ContextMenu.Content data-testid="menu">
            <ContextMenu.Item>Option</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      fireEvent.contextMenu(screen.getByTestId("trigger"));
      expect(handleOpenChange).toHaveBeenCalledWith(true, expect.any(Object));
    });
  });

  describe("disabled behavior", () => {
    it("marks disabled items and prevents click execution", async () => {
      const handleDisabledClick = vi.fn();

      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item disabled onClick={handleDisabledClick}>
              Locked action
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const item = await screen.findByRole("menuitem", { name: "Locked action" });
      expect(item).toHaveAttribute("data-disabled");

      await userEvent.click(item);
      expect(handleDisabledClick).not.toHaveBeenCalled();
    });

    it("does not open when root is disabled", () => {
      render(
        <ContextMenu disabled>
          <ContextMenu.Trigger data-testid="trigger">Disabled target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Action</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      fireEvent.contextMenu(screen.getByTestId("trigger"));
      expect(screen.queryByRole("menuitem", { name: "Action" })).not.toBeInTheDocument();
    });
  });

  describe("context menu events and keyboard navigation", () => {
    it("opens on a contextmenu event", async () => {
      render(
        <ContextMenu>
          <ContextMenu.Trigger data-testid="trigger">Target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Properties</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const trigger = screen.getByTestId("trigger");
      trigger.focus();
      fireEvent.contextMenu(trigger);

      expect(await screen.findByRole("menuitem", { name: "Properties" })).toBeInTheDocument();
    });

    it("closes the open menu when Escape is pressed", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>First</ContextMenu.Item>
            <ContextMenu.Item>Second</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      expect(await screen.findByRole("menuitem", { name: "First" })).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("menuitem", { name: "First" })).not.toBeInTheDocument();
      });
    });

    it("highlights items via arrow keys", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Item 1</ContextMenu.Item>
            <ContextMenu.Item>Item 2</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const menu = await screen.findByRole("menu");
      const firstItem = screen.getByRole("menuitem", { name: "Item 1" });
      menu.focus();

      await userEvent.keyboard("{ArrowDown}");

      await waitFor(() => {
        expect(firstItem).toHaveAttribute("data-highlighted");
      });
    });
  });

  describe("placement props", () => {
    it("opens below the anchor, start-aligned, by default", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content data-testid="menu">
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const menu = await screen.findByTestId("menu");
      expect(menu).toHaveAttribute("data-side", "bottom");
      expect(menu).toHaveAttribute("data-align", "start");
    });

    it("forwards side and align without leaking placement props to the popup", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content side="top" align="end" alignOffset={4} sideOffset={8} data-testid="menu">
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const menu = await screen.findByTestId("menu");
      expect(menu).toHaveAttribute("data-side", "top");
      expect(menu).toHaveAttribute("data-align", "end");
      expect(menu).not.toHaveAttribute("side");
    });
  });

  describe("portal theme attributes", () => {
    it("propagates provider theme and material tokens onto the portaled popup", async () => {
      render(
        <FujiProvider
          defaultTheme="dark"
          defaultMaterial="glass"
          defaultRadius="soft"
          defaultElevation="floating"
        >
          <ContextMenu defaultOpen>
            <ContextMenu.Trigger>Target</ContextMenu.Trigger>
            <ContextMenu.Content data-testid="menu">
              <ContextMenu.Item>Themed item</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu>
        </FujiProvider>,
      );

      const menu = await screen.findByTestId("menu");
      expect(menu).toHaveAttribute("data-fuji-theme", "dark");
      expect(menu).toHaveAttribute("data-fuji-material", "glass");
      expect(menu).toHaveAttribute("data-fuji-radius", "soft");
      expect(menu).toHaveAttribute("data-fuji-elevation", "floating");
    });
  });

  describe("groups, labels, and separators", () => {
    it("renders groups with labels and separators", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Target</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Actions</ContextMenu.GroupLabel>
              <ContextMenu.Item>Edit</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator data-testid="separator" />
            <ContextMenu.Item>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      expect(await screen.findByText("Actions")).toBeInTheDocument();
      expect(screen.getByTestId("separator")).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    });
  });

  describe("ref forwarding", () => {
    it("forwards refs to Content, Item, and Trigger elements", async () => {
      const contentRef = React.createRef<HTMLDivElement>();
      const itemRef = React.createRef<HTMLDivElement>();
      const triggerRef = React.createRef<HTMLDivElement>();

      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger ref={triggerRef}>Target</ContextMenu.Trigger>
          <ContextMenu.Content ref={contentRef}>
            <ContextMenu.Item ref={itemRef}>Item</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      await screen.findByRole("menuitem", { name: "Item" });
      expect(triggerRef.current).toBeInstanceOf(HTMLElement);
      expect(contentRef.current).toBeInstanceOf(HTMLElement);
      expect(itemRef.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe("accessibility (axe)", () => {
    it("has no axe violations when closed", async () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenu.Trigger>Right click here</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Action 1</ContextMenu.Item>
            <ContextMenu.Item>Action 2</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations when open in document.body", async () => {
      render(
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Right click here</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>File actions</ContextMenu.GroupLabel>
              <ContextMenu.Item>Rename</ContextMenu.Item>
              <ContextMenu.Item>Download</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator />
            <ContextMenu.Item>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>,
      );

      const menu = await screen.findByRole("menu");
      expect(await axe(menu)).toHaveNoViolations();
    });
  });
});
