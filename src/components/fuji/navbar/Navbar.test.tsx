import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar, type NavbarItem, type NavbarLinkProps } from "./Navbar";

describe("Navbar", () => {
  it("renders a safe href on an item", () => {
    render(<Navbar items={[{ label: "Docs", href: "/docs" }]} />);
    const anchor = screen.getByText("Docs").closest("a");
    expect(anchor).toHaveAttribute("href", "/docs");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<Navbar items={[{ label: "Docs", href: "javascript:alert(1)" }]} />);
    const anchor = screen.getByText("Docs").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });

  it("renders a button and calls onItemSelect when an item has no href", async () => {
    const onItemSelect = vi.fn();
    const user = userEvent.setup();
    render(<Navbar items={[{ label: "Settings" }]} onItemSelect={onItemSelect} />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(onItemSelect).toHaveBeenCalledWith({ label: "Settings" }, 0);
  });

  describe("renderLink", () => {
    // Stand-in for a router `Link`: a component that forwards props to an <a>.
    const RouterLink = ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a data-router="" {...props}>
        {children}
      </a>
    );

    it("passes aria-current, className, href and children as a third argument", () => {
      const renderLink = vi.fn(
        (_item: NavbarItem, _children: React.ReactNode, linkProps: NavbarLinkProps) => (
          <RouterLink {...linkProps} />
        ),
      );
      render(<Navbar items={[{ label: "Docs", href: "/docs", active: true }]} renderLink={renderLink} />);
      const linkProps = renderLink.mock.calls[0]![2];
      expect(linkProps).toMatchObject({ href: "/docs", "aria-current": "page" });
      expect(linkProps.className).toEqual(expect.stringContaining("focus-visible:outline-2"));
      const anchor = screen.getByText("Docs").closest("a");
      expect(anchor).toHaveAttribute("data-router");
      expect(anchor).toHaveAttribute("aria-current", "page");
    });

    it("applies aria-current and the link classes when the consumer ignores the third argument", () => {
      render(
        <Navbar
          items={[
            { label: "Docs", href: "/docs", active: true },
            { label: "Blog", href: "/blog" },
          ]}
          renderLink={(item, children) => (
            <RouterLink href={item.href} className="consumer-class">
              {children}
            </RouterLink>
          )}
        />,
      );
      const active = screen.getByText("Docs").closest("a");
      expect(active).toHaveAttribute("aria-current", "page");
      expect(active).toHaveClass("consumer-class");
      expect(active?.className).toEqual(expect.stringContaining("focus-visible:outline-2"));
      expect(screen.getByText("Blog").closest("a")).not.toHaveAttribute("aria-current");
    });

    it("keeps a consumer's own aria-current", () => {
      render(
        <Navbar
          items={[{ label: "Docs", href: "/docs", active: true }]}
          renderLink={(item, children) => (
            <RouterLink href={item.href} aria-current="location">
              {children}
            </RouterLink>
          )}
        />,
      );
      expect(screen.getByText("Docs").closest("a")).toHaveAttribute("aria-current", "location");
    });
  });
});
