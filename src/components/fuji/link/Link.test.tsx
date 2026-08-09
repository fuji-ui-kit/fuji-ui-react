import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Link } from "./Link";

describe("Link", () => {
  it("forwards its ref and renders a safe href", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs">
        Docs
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("drops an unsafe href instead of rendering it", () => {
    render(<Link href="javascript:alert(1)">Click me</Link>);
    // An <a> with no `href` has no implicit link role anymore, so this has to
    // query by text/tag rather than `getByRole("link", ...)`.
    const anchor = screen.getByText("Click me").closest("a");
    expect(anchor).not.toHaveAttribute("href");
  });
});
