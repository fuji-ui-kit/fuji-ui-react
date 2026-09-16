import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type * as React from "react";
import { Breadcrumb, type BreadcrumbItem, type BreadcrumbLinkProps } from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("renders a safe href on a non-last item", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Docs" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).toHaveAttribute("href", "/");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "javascript:alert(1)" }, { label: "Docs" }]} />);
    const anchor = screen.getByText("Home").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });

  it("hands renderLink the default anchor's href, className and children", () => {
    const renderLink = vi.fn(
      (item: BreadcrumbItem, children: React.ReactNode, _linkProps: BreadcrumbLinkProps) => (
        <a href={item.href}>{children}</a>
      ),
    );
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Docs" }]} renderLink={renderLink} />);
    const linkProps = renderLink.mock.calls[0]![2];
    expect(linkProps).toMatchObject({ href: "/" });
    expect(linkProps.className).toEqual(expect.stringContaining("focus-visible:outline-2"));
    // Applied even though the consumer did not spread it.
    expect(screen.getByText("Home").closest("a")?.className).toEqual(
      expect.stringContaining("focus-visible:outline-2"),
    );
    // The current page is never passed to renderLink and keeps aria-current.
    expect(renderLink).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Docs").parentElement).toHaveAttribute("aria-current", "page");
  });
});
