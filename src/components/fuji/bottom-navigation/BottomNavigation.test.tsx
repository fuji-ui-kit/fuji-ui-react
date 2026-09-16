import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import type * as React from "react";
import {
  BottomNavigation,
  type BottomNavigationItem,
  type BottomNavigationLinkProps,
} from "./BottomNavigation";

describe("BottomNavigation", () => {
  it("renders a safe href on an item", () => {
    render(<BottomNavigation items={[{ label: "Home", icon: <span />, href: "/" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).toHaveAttribute("href", "/");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<BottomNavigation items={[{ label: "Home", icon: <span />, href: "javascript:alert(1)" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });

  it("passes aria-current and the link props to renderLink, and applies them when not spread", async () => {
    const onItemSelect = vi.fn();
    const renderLink = vi.fn(
      (item: BottomNavigationItem, children: React.ReactNode, _linkProps: BottomNavigationLinkProps) => (
        <a href={item.href} data-router="">
          {children}
        </a>
      ),
    );
    const items = [
      { label: "Home", icon: <span />, href: "/", active: true },
      { label: "Chats", icon: <span />, href: "/chats" },
    ];
    render(<BottomNavigation items={items} renderLink={renderLink} onItemSelect={onItemSelect} />);
    expect(renderLink.mock.calls[0]![2]).toMatchObject({ href: "/", "aria-current": "page" });
    const home = screen.getByText("Home").closest("a");
    expect(home).toHaveAttribute("data-router");
    expect(home).toHaveAttribute("aria-current", "page");
    expect(home?.className).toEqual(expect.stringContaining("flex-1"));
    expect(screen.getByText("Chats").closest("a")).not.toHaveAttribute("aria-current");
    // `onItemSelect` fires alongside navigation, as it does for the default anchor.
    screen
      .getByText("Chats")
      .closest("a")!
      .addEventListener("click", (event) => event.preventDefault());
    await userEvent.click(screen.getByText("Chats"));
    expect(onItemSelect).toHaveBeenCalledWith(items[1], 1);
  });

  it("includes a numeric badge in the item's accessible name", () => {
    render(<BottomNavigation items={[{ label: "Chats", icon: <span />, href: "/chats", badge: 3 }]} />);
    expect(screen.getByRole("link", { name: /^Chats\s*, 3 unread$/ })).toBeInTheDocument();
    // The visual pill is hidden from AT - the hidden text replaces it.
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
  });

  it("caps a large count at 99+ and hides a zero badge", () => {
    const { rerender } = render(
      <BottomNavigation items={[{ label: "Chats", icon: <span />, href: "/chats", badge: 120 }]} />,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Chats\s*, 120 unread$/ })).toBeInTheDocument();
    rerender(<BottomNavigation items={[{ label: "Chats", icon: <span />, href: "/chats", badge: 0 }]} />);
    expect(screen.getByRole("link", { name: /^Chats$/ })).toBeInTheDocument();
  });

  it("uses badgeLabel for the announced text, including on a non-numeric badge", () => {
    render(
      <BottomNavigation
        onItemSelect={() => {}}
        items={[
          { label: "Requests", icon: <span />, badge: 2, badgeLabel: "2 pending requests" },
          { label: "Updates", icon: <span />, badge: "New", badgeLabel: "new updates" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /^Requests\s*, 2 pending requests$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Updates\s*, new updates$/ })).toBeInTheDocument();
  });

  it("has no obvious accessibility violations with badges", async () => {
    const { container } = render(
      <BottomNavigation
        items={[
          { label: "Home", icon: <span />, href: "/", active: true },
          { label: "Chats", icon: <span />, href: "/chats", badge: 3 },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
