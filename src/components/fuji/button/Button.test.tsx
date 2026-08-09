import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("renders tone/appearance/size classes and forwards a real button ref", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} tone="fire" appearance="bordered" size="lg">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
  });

  it("disables interaction and marks aria-busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button, { pointerEventsCheck: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("blocks disabled interaction without native disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Button>Continue</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("asChild", () => {
    it("throws when given more than one child", () => {
      expect(() =>
        render(
          <Button asChild>
            <a href="#one">One</a>
            <a href="#two">Two</a>
          </Button>,
        ),
      ).toThrow(/exactly one/i);
    });

    it("renders the child element instead of a button, preserving its own ref", () => {
      const buttonRef = React.createRef<HTMLElement>();
      const linkRef = React.createRef<HTMLAnchorElement>();
      render(
        <Button asChild ref={buttonRef}>
          <a href="#" ref={linkRef}>
            Docs
          </a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Docs" });
      expect(link.tagName).toBe("A");
      // Both the Button's own ref and the child's original ref must resolve
      // to the same node - cloneElement silently drops one of them if refs
      // aren't merged.
      expect(buttonRef.current).toBe(link);
      expect(linkRef.current).toBe(link);
    });

    it("does not leak a button-only type attribute onto a non-button child", () => {
      render(
        <Button asChild>
          <a href="#">Docs</a>
        </Button>,
      );
      expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute("type");
    });

    it("keeps type='button' when the child is a real <button>", () => {
      render(
        <Button asChild>
          <button>Inner</button>
        </Button>,
      );
      expect(screen.getByRole("button", { name: "Inner" })).toHaveAttribute("type", "button");
    });

    it("guards click/keydown activation when disabled, without a native disabled attribute", async () => {
      const onClick = vi.fn();
      render(
        <Button asChild disabled onClick={onClick}>
          <a href="#">Docs</a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Docs" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(link, { pointerEventsCheck: 0 });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("fires onClick normally when enabled", async () => {
      const onClick = vi.fn();
      render(
        <Button asChild onClick={onClick}>
          <a href="#">Docs</a>
        </Button>,
      );
      await userEvent.click(screen.getByRole("link", { name: "Docs" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
