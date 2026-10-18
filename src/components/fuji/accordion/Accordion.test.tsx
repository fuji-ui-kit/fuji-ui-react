import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  Accordion,
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
} from "./Accordion";

function Fixture({
  defaultValue,
  value,
  onValueChange,
  multiple,
  disabled,
  itemDisabled,
  hideIcon,
}: {
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  itemDisabled?: boolean;
  hideIcon?: boolean;
}) {
  return (
    <Accordion
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      multiple={multiple}
      disabled={disabled}
    >
      <Accordion.Item value="item-1">
        <Accordion.Header>
          <Accordion.Trigger hideIcon={hideIcon}>Section 1</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Content 1</Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-2" disabled={itemDisabled}>
        <Accordion.Header>
          <Accordion.Trigger>Section 2</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Content 2</Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-3">
        <Accordion.Header>
          <Accordion.Trigger>Section 3</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Content 3</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

describe("Accordion", () => {
  describe("default and open behavior", () => {
    it("starts closed by default and opens on trigger click", async () => {
      const user = userEvent.setup();
      render(<Fixture />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

      await user.click(trigger1);
      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("collapses when clicking an open item trigger", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue={["item-1"]} />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      await user.click(trigger1);
      expect(trigger1).toHaveAttribute("aria-expanded", "false");
    });

    it("honors uncontrolled defaultValue", () => {
      render(<Fixture defaultValue={["item-2"]} />);

      expect(screen.getByRole("button", { name: "Section 1" })).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByRole("button", { name: "Section 2" })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("single and multiple modes", () => {
    it("in single mode (default), opening a second item closes the first", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue={["item-1"]} />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      const trigger2 = screen.getByRole("button", { name: "Section 2" });

      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger2);

      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(trigger2).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("in multiple mode, allows multiple items to remain open simultaneously", async () => {
      const user = userEvent.setup();
      render(<Fixture multiple defaultValue={["item-1"]} />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      const trigger2 = screen.getByRole("button", { name: "Section 2" });

      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger2);

      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(trigger2).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("controlled operation", () => {
    it("renders the controlled value and fires onValueChange", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(<Fixture value={["item-1"]} onValueChange={onValueChange} />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      const trigger2 = screen.getByRole("button", { name: "Section 2" });

      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger2);

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(["item-2"], expect.anything());
    });

    it("does not update uncontrolled state when controlled value is provided", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(<Fixture value={["item-1"]} onValueChange={onValueChange} />);

      const trigger2 = screen.getByRole("button", { name: "Section 2" });
      await user.click(trigger2);

      // Value prop was not changed by a re-render, so item-1 stays open and item-2 stays closed
      expect(screen.getByRole("button", { name: "Section 1" })).toHaveAttribute("aria-expanded", "true");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("disabled state", () => {
    it("disables all triggers when Accordion.Root is disabled", async () => {
      const user = userEvent.setup();
      render(<Fixture disabled />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      expect(trigger1).toHaveAttribute("data-disabled", "");
      expect(trigger1).toHaveAttribute("aria-disabled", "true");

      await user.click(trigger1);
      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("disables only the targeted item when Accordion.Item is disabled", async () => {
      const user = userEvent.setup();
      render(<Fixture itemDisabled />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      const trigger2 = screen.getByRole("button", { name: "Section 2" });

      expect(trigger2).toHaveAttribute("data-disabled", "");
      expect(trigger2).toHaveAttribute("aria-disabled", "true");

      await user.click(trigger2);
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      // Non-disabled item can still be opened
      await user.click(trigger1);
      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("keyboard behavior", () => {
    it("toggles items with Enter and Space keys", async () => {
      const user = userEvent.setup();
      render(<Fixture />);

      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      trigger1.focus();
      expect(trigger1).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(trigger1).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      await user.keyboard(" ");
      expect(trigger1).toHaveAttribute("aria-expanded", "false");
    });

    it("supports keyboard tab navigation between triggers", async () => {
      const user = userEvent.setup();
      render(<Fixture />);

      await user.tab();
      expect(screen.getByRole("button", { name: "Section 1" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: "Section 2" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: "Section 3" })).toHaveFocus();
    });
  });

  describe("refs and class name merging", () => {
    it("forwards refs to all individual parts", () => {
      const rootRef = React.createRef<HTMLDivElement>();
      const itemRef = React.createRef<HTMLDivElement>();
      const headerRef = React.createRef<HTMLHeadingElement>();
      const triggerRef = React.createRef<HTMLElement>();
      const panelRef = React.createRef<HTMLDivElement>();

      render(
        <AccordionRoot ref={rootRef} defaultValue={["a"]} data-testid="accordion-root">
          <AccordionItem ref={itemRef} value="a" data-testid="accordion-item">
            <AccordionHeader ref={headerRef} data-testid="accordion-header">
              <AccordionTrigger ref={triggerRef} data-testid="accordion-trigger">
                Header
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel ref={panelRef} data-testid="accordion-panel">
              Body
            </AccordionPanel>
          </AccordionItem>
        </AccordionRoot>,
      );

      expect(rootRef.current).toBe(screen.getByTestId("accordion-root"));
      expect(itemRef.current).toBe(screen.getByTestId("accordion-item"));
      expect(headerRef.current).toBe(screen.getByTestId("accordion-header"));
      expect(triggerRef.current).toBe(screen.getByTestId("accordion-trigger"));
      expect(panelRef.current).toBe(screen.getByTestId("accordion-panel"));
    });

    it("merges custom className and applies slot classes", () => {
      render(
        <Accordion className="custom-root" defaultValue={["a"]}>
          <Accordion.Item value="a" className="custom-item">
            <Accordion.Header className="custom-header">
              <Accordion.Trigger className="custom-trigger">Trigger</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="custom-panel" classNames={{ content: "custom-content" }}>
              Panel Content
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>,
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });
      const panel = screen.getByRole("region");

      expect(trigger).toHaveClass("custom-trigger");
      expect(panel).toHaveClass("custom-panel");
      expect(screen.getByText("Panel Content")).toHaveClass("custom-content");
    });

    it("preserves Base UI state callbacks passed to className", () => {
      render(
        <Accordion
          data-testid="callback-root"
          className={(state) => (state.value.includes("a") ? "root-open" : "root-closed")}
          defaultValue={["a"]}
        >
          <Accordion.Item
            data-testid="callback-item"
            value="a"
            className={(state) => (state.open ? "item-open" : "item-closed")}
          >
            <Accordion.Header>
              <Accordion.Trigger className={(state) => (state.open ? "trigger-open" : "trigger-closed")}>
                Trigger
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={(state) => (state.open ? "panel-open" : "panel-closed")}>
              Panel Content
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>,
      );

      expect(screen.getByTestId("callback-root")).toHaveClass("root-open");
      expect(screen.getByTestId("callback-item")).toHaveClass("item-open");
      expect(screen.getByRole("button", { name: "Trigger" })).toHaveClass("trigger-open");
      expect(screen.getByRole("region")).toHaveClass("panel-open");
    });

    it("hides the chevron icon when hideIcon is set", () => {
      render(<Fixture hideIcon />);
      const trigger1 = screen.getByRole("button", { name: "Section 1" });
      expect(trigger1.querySelector("svg")).not.toBeInTheDocument();

      const trigger2 = screen.getByRole("button", { name: "Section 2" });
      expect(trigger2.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations when closed", async () => {
      const { container } = render(<Fixture />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no accessibility violations when open", async () => {
      const { container } = render(<Fixture defaultValue={["item-1"]} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
